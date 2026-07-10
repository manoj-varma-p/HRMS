import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/ApiError";
import { verifyAccessToken } from "../utils/token";
import { LOGIN_ALLOWED_STATUSES } from "../constants/employeeStatus";
import { UserModel } from "../../modules/user/user.model";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  const token = header.slice("Bearer ".length);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    next(new ApiError(401, "Invalid or expired access token"));
    return;
  }

  // A short-lived access token alone can't be revoked, so a status change
  // (e.g. deactivation) wouldn't take effect until the token's natural
  // expiry without this — a live, indexed lookup on every request instead
  // of trusting the token's stale claims, so a deactivated account is
  // locked out immediately rather than up to accessTokenLifetimeMinutes
  // later.
  const user = await UserModel.findById(payload.sub).select("status");
  if (!user || !LOGIN_ALLOWED_STATUSES.includes(user.status)) {
    next(new ApiError(401, "This account is no longer active"));
    return;
  }

  req.user = {
    id: payload.sub,
    role: payload.role,
    employeeId: payload.employeeId,
  };
  next();
}
