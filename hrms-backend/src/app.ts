import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env, isProduction } from "./shared/config/env";
import { apiRateLimiter } from "./shared/middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./shared/middleware/errorHandler";
import { logger } from "./shared/utils/logger";
import moduleRoutes from "./modules";

export function createApp(): Application {
  const app = express();

  // Only trust the first hop's X-Forwarded-* headers, and only in
  // production — behind an AWS load balancer, without this, req.ip
  // resolves to the LB's address for every request, which makes
  // express-rate-limit key its buckets off one shared IP instead of the
  // real client (see RC Audit, High finding #3). Left unset locally so
  // dev behavior is unchanged.
  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(helmet());
  const devOrigins = ["http://localhost:3000", "http://localhost:3001"];
  const origins = Array.from(new Set([env.clientOrigin, ...devOrigins]));

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(
    morgan(isProduction ? "combined" : "dev", {
      stream: { write: (message: string) => logger.info(message.trim()) },
    })
  );
  // Explicit ceiling instead of Express's implicit 100kb default (RC
  // Audit, Low finding) — every current payload (JSON bodies for
  // employee/announcement/config forms) is well under this.
  app.use(express.json({ limit: "256kb" }));
  app.use(cookieParser());
  app.use(apiRateLimiter);

  app.use(`/api/${env.apiVersion}`, moduleRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
