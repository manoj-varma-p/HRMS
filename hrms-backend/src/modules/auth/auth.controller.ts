import { Request, Response } from "express";
import { isProduction } from "../../shared/config/env";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import { ApiError } from "../../shared/errors/ApiError";
import { getSecuritySettings } from "../configuration/configuration.cache";
import * as authService from "./auth.service";

const REFRESH_COOKIE_NAME = "hrms_refresh_token";
const REFRESH_COOKIE_PATH = "/api/v1/auth";

// The cookie's own Max-Age is "Session Timeout" (how long the browser
// keeps presenting the session before the user must log in again) —
// distinct from "Refresh Token Lifetime" (securitySettings.
// refreshTokenLifetimeDays), which controls the JWT's own cryptographic
// expiry claim. The two are independently configurable in Phase 9.
function setRefreshCookie(res: Response, refreshToken: string): void {
  const { sessionTimeoutMinutes } = getSecuritySettings();
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: sessionTimeoutMinutes * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const { tokens, user } = await authService.login(email, password);
  setRefreshCookie(res, tokens.refreshToken);
  sendSuccess(res, { accessToken: tokens.accessToken, user }, "Login successful");
}

async function refresh(req: Request, res: Response): Promise<void> {
  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawRefreshToken) {
    throw new ApiError(401, "No active session");
  }

  const { tokens, user } = await authService.refresh(rawRefreshToken);
  setRefreshCookie(res, tokens.refreshToken);
  sendSuccess(res, { accessToken: tokens.accessToken, user }, "Session refreshed");
}

async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    await authService.logout(req.user.id);
  }
  clearRefreshCookie(res);
  sendSuccess(res, null, "Logged out");
}

async function setPassword(req: Request, res: Response): Promise<void> {
  const { newPassword } = req.body;
  const { tokens, user } = await authService.setPassword(
    req.user!.id,
    newPassword
  );
  setRefreshCookie(res, tokens.refreshToken);
  sendSuccess(res, { accessToken: tokens.accessToken, user }, "Password updated");
}

async function adminResetPassword(req: Request, res: Response): Promise<void> {
  const { tempPassword, user } = await authService.adminResetPassword(
    req.user!,
    String(req.params.userId)
  );
  sendSuccess(res, { tempPassword, user }, "Password reset - share the temporary password with the employee");
}

async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(req.user!.id);
  sendSuccess(res, { user });
}

export { login, refresh, logout, setPassword, adminResetPassword, me };
