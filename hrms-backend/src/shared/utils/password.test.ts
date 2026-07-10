import { describe, it, expect, vi, beforeEach } from "vitest";

// validatePasswordAgainstPolicy reads live Configuration via
// configuration.cache — mocked here so this stays a fast, DB-free unit
// test that exercises the real validation logic against a controlled
// policy, rather than an integration test against Mongo.
const getSecuritySettings = vi.fn();
vi.mock("../../modules/configuration/configuration.cache", () => ({
  getSecuritySettings: () => getSecuritySettings(),
}));

import { validatePasswordAgainstPolicy, hashSecret, compareSecret, generateTempPassword } from "./password";
import { ApiError } from "../errors/ApiError";

describe("validatePasswordAgainstPolicy", () => {
  beforeEach(() => {
    getSecuritySettings.mockReset();
  });

  it("accepts a password meeting the minimum length when complexity is off", () => {
    getSecuritySettings.mockReturnValue({ minPasswordLength: 8, passwordComplexity: false });
    expect(() => validatePasswordAgainstPolicy("plainlong")).not.toThrow();
  });

  it("rejects a password shorter than the configured minimum", () => {
    getSecuritySettings.mockReturnValue({ minPasswordLength: 10, passwordComplexity: false });
    expect(() => validatePasswordAgainstPolicy("short1")).toThrow(ApiError);
    expect(() => validatePasswordAgainstPolicy("short1")).toThrow(/at least 10 characters/);
  });

  it("honors a changed minimum length (regression guard for the Configuration wiring itself)", () => {
    getSecuritySettings.mockReturnValue({ minPasswordLength: 6, passwordComplexity: false });
    expect(() => validatePasswordAgainstPolicy("abcdef")).not.toThrow();
    getSecuritySettings.mockReturnValue({ minPasswordLength: 12, passwordComplexity: false });
    expect(() => validatePasswordAgainstPolicy("abcdef")).toThrow(ApiError);
  });

  it("passes a password satisfying every complexity requirement", () => {
    getSecuritySettings.mockReturnValue({ minPasswordLength: 8, passwordComplexity: true });
    expect(() => validatePasswordAgainstPolicy("Abcdef1!")).not.toThrow();
  });

  it.each([
    ["missing uppercase", "abcdef1!"],
    ["missing lowercase", "ABCDEF1!"],
    ["missing digit", "Abcdefgh!"],
    ["missing symbol", "Abcdefg1"],
  ])("rejects a complex-required password %s", (_label, password) => {
    getSecuritySettings.mockReturnValue({ minPasswordLength: 8, passwordComplexity: true });
    expect(() => validatePasswordAgainstPolicy(password)).toThrow(
      /uppercase, lowercase, a number, and a symbol/
    );
  });

  it("does not enforce complexity when the policy has it disabled, even for a simple password", () => {
    getSecuritySettings.mockReturnValue({ minPasswordLength: 4, passwordComplexity: false });
    expect(() => validatePasswordAgainstPolicy("aaaa")).not.toThrow();
  });
});

describe("hashSecret / compareSecret", () => {
  it("round-trips: a hashed password compares true against its own plaintext", async () => {
    const hash = await hashSecret("correct horse battery staple");
    await expect(compareSecret("correct horse battery staple", hash)).resolves.toBe(true);
  });

  it("does not match a different plaintext", async () => {
    const hash = await hashSecret("correct horse battery staple");
    await expect(compareSecret("wrong password", hash)).resolves.toBe(false);
  });

  it("never stores the plaintext in the hash output", async () => {
    const plain = "correct horse battery staple";
    const hash = await hashSecret(plain);
    expect(hash).not.toContain(plain);
  });
});

describe("generateTempPassword", () => {
  it("defaults to 12 characters", () => {
    expect(generateTempPassword()).toHaveLength(12);
  });

  it("respects a custom length", () => {
    expect(generateTempPassword(20)).toHaveLength(20);
  });

  it("only uses characters from the unambiguous temp-password alphabet (no 0/O/I/l/1 confusion)", () => {
    const password = generateTempPassword(64);
    expect(password).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%]+$/);
  });

  it("produces different output on successive calls (uses real randomness, not a fixed seed)", () => {
    const a = generateTempPassword();
    const b = generateTempPassword();
    expect(a).not.toBe(b);
  });
});
