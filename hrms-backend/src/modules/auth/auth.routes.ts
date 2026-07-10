import { Router } from "express";
import { validate } from "../../shared/middleware/validate";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { authRateLimiter } from "../../shared/middleware/rateLimiter";
import { ROLES } from "../../shared/constants/roles";
import {
  adminResetPasswordSchema,
  loginSchema,
  setPasswordSchema,
} from "./auth.validation";
import * as authController from "./auth.controller";

const router = Router();

router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  authController.login
);
router.post("/refresh", authRateLimiter, authController.refresh);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.me);

router.post(
  "/set-password",
  authenticate,
  validate(setPasswordSchema),
  authController.setPassword
);

router.post(
  "/admin/reset-password/:userId",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validate(adminResetPasswordSchema),
  authController.adminResetPassword
);

export default router;
