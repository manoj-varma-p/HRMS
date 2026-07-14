import { Router } from "express";
import * as publicController from "./public.controller";

// Deliberately outside the authenticate/authorize gate — see
// public.controller.ts for exactly what is (and isn't) exposed here and why.
const router = Router();

router.get("/company-logo", publicController.getCompanyLogo);
router.get("/company-branding", publicController.getCompanyBranding);

export default router;
