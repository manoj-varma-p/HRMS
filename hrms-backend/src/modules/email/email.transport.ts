import nodemailer, { Transporter } from "nodemailer";
import { SESClient } from "@aws-sdk/client-ses";
import { ApiError } from "../../shared/errors/ApiError";
import { decryptSecret } from "../../shared/utils/crypto";
import { EMAIL_PROVIDER, IConfiguration } from "../configuration/configuration.model";

export interface ResolvedSender {
  transport: Transporter;
  from: string;
}

/**
 * Builds a nodemailer transport straight from whatever is currently saved
 * in Configuration.emailSettings — not the 30s-TTL cache, since this is a
 * low-frequency admin/notification path where correctness (pick up a
 * setting the admin just saved) matters far more than shaving one DB read.
 * SMTP and SES both go through nodemailer (SES via its built-in SES
 * transport), so callers never branch on provider themselves.
 */
export function resolveSender(config: IConfiguration): ResolvedSender {
  const { emailSettings } = config;

  if (emailSettings.provider === EMAIL_PROVIDER.SES) {
    const { region, accessKeyEncrypted, secretKeyEncrypted, verifiedSender } = emailSettings.ses;
    if (!region || !accessKeyEncrypted || !secretKeyEncrypted || !verifiedSender) {
      throw new ApiError(
        503,
        "SES email settings are incomplete — set region, access key, secret key, and verified sender under Administration > Email Settings"
      );
    }
    const sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId: decryptSecret(accessKeyEncrypted),
        secretAccessKey: decryptSecret(secretKeyEncrypted),
      },
    });
    const transport = nodemailer.createTransport({ SES: { sesClient } } as never);
    return { transport, from: verifiedSender };
  }

  const { host, port, username, passwordEncrypted, fromName, fromEmail } = emailSettings.smtp;
  if (!host || !port || !username || !passwordEncrypted || !fromEmail) {
    throw new ApiError(
      503,
      "SMTP email settings are incomplete — set host, port, username, password, and from email under Administration > Email Settings"
    );
  }
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: username, pass: decryptSecret(passwordEncrypted) },
  });
  const from = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
  return { transport, from };
}
