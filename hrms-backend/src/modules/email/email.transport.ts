import nodemailer, { Transporter } from "nodemailer";
import { SESClient } from "@aws-sdk/client-ses";
import { ApiError } from "../../shared/errors/ApiError";
import { decryptSecret } from "../../shared/utils/crypto";
import {
  EMAIL_PROVIDER,
  EmailProvider,
  IConfiguration,
} from "../configuration/configuration.model";

export interface ResolvedSender {
  provider: EmailProvider;
  transport?: Transporter;
  sesClient?: SESClient;
  from: string;
}

export function resolveSender(config: IConfiguration): ResolvedSender {
  const { emailSettings } = config;

  if (emailSettings.provider === EMAIL_PROVIDER.SES) {
    const {
      region,
      accessKeyEncrypted,
      secretKeyEncrypted,
      verifiedSender,
    } = emailSettings.ses;

    if (
      !region ||
      !accessKeyEncrypted ||
      !secretKeyEncrypted ||
      !verifiedSender
    ) {
      throw new ApiError(
        503,
        "SES email settings are incomplete."
      );
    }

    const sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId: decryptSecret(accessKeyEncrypted),
        secretAccessKey: decryptSecret(secretKeyEncrypted),
      },
    });

    return {
      provider: EMAIL_PROVIDER.SES,
      sesClient,
      from: verifiedSender,
    };
  }

  const {
    host,
    port,
    username,
    passwordEncrypted,
    fromName,
    fromEmail,
  } = emailSettings.smtp;

  if (
    !host ||
    !port ||
    !username ||
    !passwordEncrypted ||
    !fromEmail
  ) {
    throw new ApiError(
      503,
      "SMTP email settings are incomplete."
    );
  }

  const transport = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: {
      user: username,
      pass: decryptSecret(passwordEncrypted),
    },
  });

  return {
    provider: EMAIL_PROVIDER.SMTP,
    transport,
    from: fromName ? `"${fromName}" <${fromEmail}>` : fromEmail,
  };
}
