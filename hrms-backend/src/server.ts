import { createApp } from "./app";
import { env } from "./shared/config/env";
import { logger } from "./shared/utils/logger";
import { connectDB } from "./shared/db/connectDB";
import { loadConfigCache } from "./modules/configuration/configuration.cache";
import { loadDepartmentHeadsCache } from "./modules/department/department.cache";

async function bootstrap(): Promise<void> {
  await connectDB();
  await loadConfigCache();
  await loadDepartmentHeadsCache();

  const app = createApp();

  app.listen(env.port, () => {
    logger.info(`HRMS API listening on port ${env.port} [${env.nodeEnv}]`);
  });
}

bootstrap();
