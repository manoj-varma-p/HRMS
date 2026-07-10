import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import {
  updateCompanyProfileSchema,
  updateOfficeSettingsSchema,
  updateLeavePolicySchema,
  updateNotificationSettingsSchema,
  updateEmailSettingsSchema,
  sendTestEmailSchema,
  updateSecuritySettingsSchema,
  updateGeneralSettingsSchema,
} from "./configuration.validation";
import * as configurationController from "./configuration.controller";

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN));

router.get("/", configurationController.get);
router.patch(
  "/company-profile",
  validate(updateCompanyProfileSchema),
  configurationController.updateCompanyProfile
);
router.patch(
  "/office-settings",
  validate(updateOfficeSettingsSchema),
  configurationController.updateOfficeSettings
);
router.patch(
  "/leave-policy",
  validate(updateLeavePolicySchema),
  configurationController.updateLeavePolicy
);
router.patch(
  "/notification-settings",
  validate(updateNotificationSettingsSchema),
  configurationController.updateNotificationSettings
);
router.patch(
  "/email-settings",
  validate(updateEmailSettingsSchema),
  configurationController.updateEmailSettings
);
router.post(
  "/email-settings/test-email",
  validate(sendTestEmailSchema),
  configurationController.sendTestEmail
);
router.patch(
  "/security-settings",
  validate(updateSecuritySettingsSchema),
  configurationController.updateSecuritySettings
);
router.patch(
  "/general-settings",
  validate(updateGeneralSettingsSchema),
  configurationController.updateGeneralSettings
);

export default router;
