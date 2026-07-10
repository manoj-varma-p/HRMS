import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "../constants/roles";
import { getSecuritySettings } from "../../modules/configuration/configuration.cache";

export interface JwtPayload {
  sub: string;
  role: Role;
  employeeId: string;
}

// Access/refresh token lifetimes come from the live Configuration cache
// (Phase 9 Security Settings) instead of fixed constants — signing reads
// the current values on every call, so an admin's change takes effect for
// the very next token issued, without a server restart.
export function signAccessToken(payload: JwtPayload): string {
  const { accessTokenLifetimeMinutes } = getSecuritySettings();
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: accessTokenLifetimeMinutes * 60,
  });
}

export function signRefreshToken(payload: JwtPayload): string {
  const { refreshTokenLifetimeDays } = getSecuritySettings();
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: refreshTokenLifetimeDays * 24 * 60 * 60,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
}
