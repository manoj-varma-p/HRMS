import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const nodeEnv = process.env.NODE_ENV ?? "development";

// Cascade: .env.<environment> if present, otherwise fall back to a plain .env.
// Lets ops maintain .env.development / .env.production side by side without
// branching config-loading logic per environment.
const envFile = `.env.${nodeEnv}`;
const envPath = fs.existsSync(path.resolve(process.cwd(), envFile))
  ? envFile
  : ".env";

dotenv.config({ path: envPath, quiet: true });

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Known dev-only fallback values. If any of these is still in effect when
// NODE_ENV=production, the app must refuse to start rather than silently
// run with a secret an attacker could read straight out of this file.
const DEV_JWT_ACCESS_SECRET = "dev-access-secret";
const DEV_JWT_REFRESH_SECRET = "dev-refresh-secret";
const DEV_CONFIG_ENCRYPTION_KEY =
  "ed8f8c3188e0aec27f07fd923b0f59fbe80cec12bb8a939a1e074d8c2322d459";

export const env = {
  nodeEnv,
  port: Number(requireEnv("PORT", "4000")),
  clientOrigin: requireEnv("CLIENT_ORIGIN", "http://localhost:3000"),
  mongoUri: requireEnv("MONGO_URI", "mongodb://localhost:27017/hrms"),
  jwtAccessSecret: requireEnv("JWT_ACCESS_SECRET", DEV_JWT_ACCESS_SECRET),
  jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET", DEV_JWT_REFRESH_SECRET),
  // 32-byte (64 hex char) key for AES-256-GCM encryption of stored secrets
  // (SMTP/SES credentials in Configuration). Dev fallback only — production
  // must set a real value.
  configEncryptionKey: requireEnv("CONFIG_ENCRYPTION_KEY", DEV_CONFIG_ENCRYPTION_KEY),
  apiVersion: "v1",
  // S3 document storage (Phase 10A). Deliberately optional, plain strings —
  // unlike the secrets above this isn't an all-users security boundary, so
  // a missing value disables document upload with a clear 503 from
  // shared/services/s3.client.ts rather than blocking the whole server from
  // booting. SES continues to use the Configuration-stored credentials
  // (see modules/email), not these.
  awsRegion: process.env.AWS_REGION,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3BucketName: process.env.S3_BUCKET_NAME,
};

export const isProduction = env.nodeEnv === "production";

// Fail fast, before connectDB()/loadConfigCache()/app.listen() ever run:
// a production deployment that forgot to set one of these three secrets
// must not boot silently on a well-known dev value (see RC Audit, Critical
// finding #1 — that value is now public, having shipped in this codebase's
// own history).
if (isProduction) {
  const stillUsingDevDefault: string[] = [];
  if (env.jwtAccessSecret === DEV_JWT_ACCESS_SECRET) stillUsingDevDefault.push("JWT_ACCESS_SECRET");
  if (env.jwtRefreshSecret === DEV_JWT_REFRESH_SECRET) stillUsingDevDefault.push("JWT_REFRESH_SECRET");
  if (env.configEncryptionKey === DEV_CONFIG_ENCRYPTION_KEY) {
    stillUsingDevDefault.push("CONFIG_ENCRYPTION_KEY");
  }
  if (stillUsingDevDefault.length > 0) {
    throw new Error(
      `Refusing to start in production with development default value(s) for: ${stillUsingDevDefault.join(", ")}. ` +
        "Set real secrets via environment variables before deploying."
    );
  }
}
