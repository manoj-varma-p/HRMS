import { describe, it, expect } from "vitest";
import { escapeRegex } from "./regex";

describe("escapeRegex", () => {
  it("leaves plain text unchanged", () => {
    expect(escapeRegex("jane doe")).toBe("jane doe");
  });

  it("escapes every regex metacharacter", () => {
    // The exact input the audit flagged as a ReDoS-shaped risk if left
    // unescaped (nested quantifiers).
    expect(escapeRegex("(a+)+$")).toBe("\\(a\\+\\)\\+\\$");
  });

  it("escapes a literal dot so it doesn't become a wildcard", () => {
    expect(escapeRegex("a.b")).toBe("a\\.b");
  });

  it("escaped output, compiled as a RegExp, matches only the literal string", () => {
    const raw = "a.b*c";
    const pattern = new RegExp(escapeRegex(raw));
    expect(pattern.test("a.b*c")).toBe(true);
    expect(pattern.test("aXbXXXc")).toBe(false); // would match if "." and "*" were left live
  });

  it("handles an empty string", () => {
    expect(escapeRegex("")).toBe("");
  });
});
