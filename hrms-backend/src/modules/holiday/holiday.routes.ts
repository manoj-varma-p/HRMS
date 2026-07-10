import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate";
import { authorize } from "../../shared/middleware/authorize";
import { validate } from "../../shared/middleware/validate";
import { ROLES } from "../../shared/constants/roles";
import {
  createHolidaySchema,
  listHolidaysSchema,
  setHolidayActiveSchema,
  updateHolidaySchema,
} from "./holiday.validation";
import * as holidayController from "./holiday.controller";

const router = Router();
const manage = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

router.use(authenticate);

router.get("/", validate(listHolidaysSchema), holidayController.list);
router.post("/", manage, validate(createHolidaySchema), holidayController.create);
router.patch(
  "/:id",
  manage,
  validate(updateHolidaySchema),
  holidayController.update
);
router.patch(
  "/:id/activate",
  manage,
  validate(setHolidayActiveSchema),
  holidayController.activate
);
router.patch(
  "/:id/deactivate",
  manage,
  validate(setHolidayActiveSchema),
  holidayController.deactivate
);

export default router;
