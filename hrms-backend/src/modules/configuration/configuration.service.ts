import { ApiError } from "../../shared/errors/ApiError";
import { toId } from "../../shared/utils/toId";
import { encryptSecret } from "../../shared/utils/crypto";
import {
  ConfigurationModel,
  IConfiguration,
  ICompanyProfile,
  IOfficeSettings,
  ILeavePolicy,
  INotificationSettings,
  ISecuritySettings,
  IGeneralSettings,
} from "./configuration.model";
import { refreshConfigCache } from "./configuration.cache";
import { sendTestEmail as dispatchTestEmail } from "../email/email.service";
import { UserModel } from "../user/user.model";
import { uploadObject } from "../../shared/services/s3.client";

interface Actor {
  id: string;
}

// Fixed — there is only ever one company logo, so there's nothing to key
// by id/version; a re-upload simply overwrites this same S3 object.
export const COMPANY_LOGO_S3_KEY = "company/logo";
export const COMPANY_LOGO_PUBLIC_PATH = "/public/company-logo";

// Always includes the select:false secret fields, even for callers that
// never touch email settings — omitting them here would leave those paths
// unloaded on the document instance, and Mongoose then overwrites unloaded
// paths with their schema default (null) on the next .save(), silently
// wiping stored SMTP/SES credentials any time an unrelated section (e.g.
// Security Settings) was updated. Loading them keeps every save a true
// no-op for paths the caller didn't change.
export async function getOrCreateConfiguration(): Promise<IConfiguration> {
  let config = await ConfigurationModel.findOne({ key: "singleton" }).select(
    "+emailSettings.smtp.passwordEncrypted +emailSettings.ses.accessKeyEncrypted +emailSettings.ses.secretKeyEncrypted"
  );
  if (!config) {
    config = await ConfigurationModel.create({ key: "singleton" });
  }
  return config;
}

// Public-facing shape: never exposes encrypted secret ciphertext, only
// whether a value has been set — the frontend renders masked placeholders
// and only sends a new value when the admin actually wants to change it.
function toPublicConfiguration(config: IConfiguration) {
  return {
    id: toId(config),
    companyProfile: config.companyProfile,
    officeSettings: config.officeSettings,
    leavePolicy: config.leavePolicy,
    notificationSettings: config.notificationSettings,
    emailSettings: {
      provider: config.emailSettings.provider,
      smtp: {
        host: config.emailSettings.smtp.host,
        port: config.emailSettings.smtp.port,
        username: config.emailSettings.smtp.username,
        hasPassword: Boolean(config.emailSettings.smtp.passwordEncrypted),
        fromName: config.emailSettings.smtp.fromName,
        fromEmail: config.emailSettings.smtp.fromEmail,
      },
      ses: {
        region: config.emailSettings.ses.region,
        hasAccessKey: Boolean(config.emailSettings.ses.accessKeyEncrypted),
        hasSecretKey: Boolean(config.emailSettings.ses.secretKeyEncrypted),
        verifiedSender: config.emailSettings.ses.verifiedSender,
      },
    },
    securitySettings: config.securitySettings,
    generalSettings: config.generalSettings,
    updatedBy: config.updatedBy,
    updatedAt: config.updatedAt,
  };
}

export async function getConfiguration() {
  const config = await getOrCreateConfiguration();
  return toPublicConfiguration(config);
}

function validateWorkingWeekend(workingDays: number[], weekendDays: number[]): void {
  const all = new Set([...workingDays, ...weekendDays]);
  if (all.size !== 7 || workingDays.some((d) => weekendDays.includes(d))) {
    throw new ApiError(
      422,
      "Working days and weekend days must together cover all 7 days with no overlap"
    );
  }
}

async function saveAndRefresh(actor: Actor, config: IConfiguration) {
  config.updatedBy = actor.id as never;
  await config.save();
  await refreshConfigCache();
  return toPublicConfiguration(config);
}

export async function updateCompanyProfile(actor: Actor, input: Partial<ICompanyProfile>) {
  const config = await getOrCreateConfiguration();
  Object.assign(config.companyProfile, input);
  return saveAndRefresh(actor, config);
}

export async function uploadCompanyLogo(actor: Actor, file: Express.Multer.File) {
  await uploadObject(COMPANY_LOGO_S3_KEY, file.buffer, file.mimetype);
  const config = await getOrCreateConfiguration();
  config.companyProfile.logoUrl = COMPANY_LOGO_PUBLIC_PATH;
  return saveAndRefresh(actor, config);
}

export async function updateOfficeSettings(actor: Actor, input: Partial<IOfficeSettings>) {
  const config = await getOrCreateConfiguration();
  // Mongoose single-nested subdocuments don't spread cleanly via `{...doc}`
  // (schema fields are accessed through getters, not own enumerable
  // properties), so the merge is built explicitly field-by-field instead.
  const nextWorkingDays = input.workingDays ?? config.officeSettings.workingDays;
  const nextWeekendDays = input.weekendDays ?? config.officeSettings.weekendDays;
  validateWorkingWeekend(nextWorkingDays, nextWeekendDays);
  Object.assign(config.officeSettings, input);
  return saveAndRefresh(actor, config);
}

export async function updateLeavePolicy(actor: Actor, input: Partial<ILeavePolicy>) {
  const config = await getOrCreateConfiguration();
  Object.assign(config.leavePolicy, input);
  return saveAndRefresh(actor, config);
}

export async function updateNotificationSettings(
  actor: Actor,
  input: Partial<INotificationSettings>
) {
  const config = await getOrCreateConfiguration();
  if (input.events) {
    Object.assign(config.notificationSettings.events, input.events);
  }
  if (input.inAppEnabled !== undefined) config.notificationSettings.inAppEnabled = input.inAppEnabled;
  if (input.emailEnabled !== undefined) config.notificationSettings.emailEnabled = input.emailEnabled;
  return saveAndRefresh(actor, config);
}

interface EmailSettingsInput {
  provider?: "SMTP" | "SES";
  smtp?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    fromName?: string;
    fromEmail?: string;
  };
  ses?: {
    region?: string;
    accessKey?: string;
    secretKey?: string;
    verifiedSender?: string;
  };
}

export async function updateEmailSettings(actor: Actor, input: EmailSettingsInput) {
  const config = await getOrCreateConfiguration();

  if (input.provider) config.emailSettings.provider = input.provider;

  if (input.smtp) {
    if (input.smtp.host !== undefined) config.emailSettings.smtp.host = input.smtp.host;
    if (input.smtp.port !== undefined) config.emailSettings.smtp.port = input.smtp.port;
    if (input.smtp.username !== undefined) config.emailSettings.smtp.username = input.smtp.username;
    if (input.smtp.fromName !== undefined) config.emailSettings.smtp.fromName = input.smtp.fromName;
    if (input.smtp.fromEmail !== undefined) config.emailSettings.smtp.fromEmail = input.smtp.fromEmail;
    // Only overwrite the stored secret if a new one was actually provided —
    // an empty/omitted field means "leave the existing credential as is."
    if (input.smtp.password) {
      config.emailSettings.smtp.passwordEncrypted = encryptSecret(input.smtp.password);
    }
  }

  if (input.ses) {
    if (input.ses.region !== undefined) config.emailSettings.ses.region = input.ses.region;
    if (input.ses.verifiedSender !== undefined) {
      config.emailSettings.ses.verifiedSender = input.ses.verifiedSender;
    }
    if (input.ses.accessKey) {
      config.emailSettings.ses.accessKeyEncrypted = encryptSecret(input.ses.accessKey);
    }
    if (input.ses.secretKey) {
      config.emailSettings.ses.secretKeyEncrypted = encryptSecret(input.ses.secretKey);
    }
  }

  return saveAndRefresh(actor, config);
}

export async function updateSecuritySettings(actor: Actor, input: Partial<ISecuritySettings>) {
  const config = await getOrCreateConfiguration();
  Object.assign(config.securitySettings, input);
  return saveAndRefresh(actor, config);
}

export async function updateGeneralSettings(actor: Actor, input: Partial<IGeneralSettings>) {
  const config = await getOrCreateConfiguration();
  Object.assign(config.generalSettings, input);
  return saveAndRefresh(actor, config);
}

// Bypasses notificationSettings.emailEnabled/events gating (unlike every
// other email, a test send should work even while email notifications are
// switched off — that's exactly the state an admin sets up SMTP/SES in)
// and surfaces the failure reason instead of swallowing it, since the
// whole point of this action is to tell the admin whether it worked.
export async function sendTestEmail(
  actor: Actor,
  to?: string
): Promise<{ success: boolean; error?: string }> {
  const requester = await UserModel.findById(actor.id).select("fullName email");
  const recipient = to ?? requester?.email;
  if (!recipient) {
    throw new ApiError(400, "No recipient email address available");
  }
  return dispatchTestEmail(recipient, requester?.fullName ?? "An administrator");
}
