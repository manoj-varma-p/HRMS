import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/ApiError";
import { Role } from "../constants/roles";

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ApiError(403, "You do not have permission to perform this action"));
      return;
    }

    next();
  };
}
