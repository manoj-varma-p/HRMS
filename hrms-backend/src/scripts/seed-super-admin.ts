import mongoose from "mongoose";
import { env } from "../shared/config/env";
import { logger } from "../shared/utils/logger";
import { hashSecret } from "../shared/utils/password";
import { ROLES } from "../shared/constants/roles";
import { EMPLOYEE_STATUS } from "../shared/constants/employeeStatus";
import { UserModel } from "../modules/user/user.model";

async function seedSuperAdmin(): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const employeeId = process.env.SUPER_ADMIN_EMPLOYEE_ID ?? "SA-0001";
  const fullName = process.env.SUPER_ADMIN_NAME ?? "Super Admin";
  const phone = process.env.SUPER_ADMIN_PHONE ?? "0000000000";

  if (!email || !password) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in the environment"
    );
  }

  await mongoose.connect(env.mongoUri);

  const existing = await UserModel.findOne({ role: ROLES.SUPER_ADMIN });
  if (existing) {
    logger.info(`A Super Admin already exists (${existing.email}); skipping seed`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await hashSecret(password);

  await UserModel.create({
    employeeId,
    email,
    passwordHash,
    role: ROLES.SUPER_ADMIN,
    status: EMPLOYEE_STATUS.ACTIVE,
    mustChangePassword: false,
    fullName,
    phone,
    joiningDate: new Date(),
  });

  logger.info(`Super Admin created: ${email}`);
  await mongoose.disconnect();
}

seedSuperAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, "Failed to seed Super Admin");
    process.exit(1);
  });
