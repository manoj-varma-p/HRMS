import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { ApiError } from "../errors/ApiError";
import { getSecuritySettings } from "../../modules/configuration/configuration.cache";

const SALT_ROUNDS = 12;
const TEMP_PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

// Only applied to user-chosen passwords (set-password) — system-generated
// temp passwords (generateTempPassword below) are exempt since they're
// already random and never typed by a human.
export function validatePasswordAgainstPolicy(password: string): void {
  const { minPasswordLength, passwordComplexity } = getSecuritySettings();

  if (password.length < minPasswordLength) {
    throw new ApiError(422, `Password must be at least ${minPasswordLength} characters`);
  }

  if (passwordComplexity) {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSymbol) {
      throw new ApiError(
        422,
        "Password must include uppercase, lowercase, a number, and a symbol"
      );
    }
  }
}

export function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function compareSecret(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateTempPassword(length = 12): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += TEMP_PASSWORD_CHARS[bytes[i] % TEMP_PASSWORD_CHARS.length];
  }
  return result;
}
