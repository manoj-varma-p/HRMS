import { ApiError } from "../../shared/errors/ApiError";
import { ROLES } from "../../shared/constants/roles";
import { LOGIN_ALLOWED_STATUSES } from "../../shared/constants/employeeStatus";
import {
  compareSecret,
  generateTempPassword,
  hashSecret,
  validatePasswordAgainstPolicy,
} from "../../shared/utils/password";
import {
  JwtPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../shared/utils/token";
import { getSecuritySettings } from "../configuration/configuration.cache";
import { IUser, UserModel } from "../user/user.model";
import { AuthTokens, PublicUser } from "./auth.types";

function toPublicUser(user: IUser): PublicUser {
  return {
    id: user._id.toString(),
    employeeId: user.employeeId,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
  };
}

async function issueTokens(user: IUser): Promise<AuthTokens> {
  const payload: JwtPayload = {
    sub: user._id.toString(),
    role: user.role,
    employeeId: user.employeeId,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshTokenHash = await hashSecret(refreshToken);
  await user.save();

  return { accessToken, refreshToken };
}

export async function login(
  email: string,
  password: string
): Promise<{ tokens: AuthTokens; user: PublicUser }> {
  const user = await UserModel.findOne({ email }).select(
    "+passwordHash +failedLoginAttempts +lockedUntil"
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new ApiError(
      423,
      `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`
    );
  }

  if (!LOGIN_ALLOWED_STATUSES.includes(user.status)) {
    throw new ApiError(403, "This account is not active");
  }

  const isValidPassword = await compareSecret(password, user.passwordHash);
  if (!isValidPassword) {
    const { maxLoginAttempts, lockoutDurationMinutes } = getSecuritySettings();
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= maxLoginAttempts) {
      user.lockedUntil = new Date(Date.now() + lockoutDurationMinutes * 60 * 1000);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw new ApiError(401, "Invalid email or password");
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;

  const tokens = await issueTokens(user);
  return { tokens, user: toPublicUser(user) };
}

export async function refresh(
  rawRefreshToken: string
): Promise<{ tokens: AuthTokens; user: PublicUser }> {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await UserModel.findById(payload.sub).select(
    "+refreshTokenHash"
  );

  if (!user || !user.refreshTokenHash) {
    throw new ApiError(401, "Session expired, please log in again");
  }

  const isValidToken = await compareSecret(
    rawRefreshToken,
    user.refreshTokenHash
  );
  if (!isValidToken) {
    // Possible token reuse after rotation - revoke the session entirely.
    user.refreshTokenHash = null;
    await user.save();
    throw new ApiError(401, "Session expired, please log in again");
  }

  if (!LOGIN_ALLOWED_STATUSES.includes(user.status)) {
    throw new ApiError(403, "This account is not active");
  }

  const tokens = await issueTokens(user);
  return { tokens, user: toPublicUser(user) };
}

export async function logout(userId: string): Promise<void> {
  await UserModel.findByIdAndUpdate(userId, { refreshTokenHash: null });
}

export async function setPassword(
  userId: string,
  newPassword: string
): Promise<{ tokens: AuthTokens; user: PublicUser }> {
  validatePasswordAgainstPolicy(newPassword);

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.passwordHash = await hashSecret(newPassword);
  user.mustChangePassword = false;

  const tokens = await issueTokens(user);
  return { tokens, user: toPublicUser(user) };
}

export async function adminResetPassword(
  actor: { id: string; role: string },
  targetUserId: string
): Promise<{ tempPassword: string; user: PublicUser }> {
  const target = await UserModel.findById(targetUserId);
  if (!target) {
    throw new ApiError(404, "User not found");
  }

  if (target.role === ROLES.SUPER_ADMIN) {
    throw new ApiError(
      403,
      "Super Admin passwords cannot be reset through this endpoint"
    );
  }

  if (target.role === ROLES.ADMIN && actor.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(403, "Only Super Admin can reset an Admin's password");
  }

  const tempPassword = generateTempPassword();
  target.passwordHash = await hashSecret(tempPassword);
  target.mustChangePassword = true;
  target.refreshTokenHash = null;
  await target.save();

  return { tempPassword, user: toPublicUser(target) };
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return toPublicUser(user);
}
