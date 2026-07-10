import { logger } from "../../shared/utils/logger";
import { getOrCreateConfiguration } from "../configuration/configuration.service";
import { resolveSender } from "./email.transport";
import { welcomeEmail, WelcomeEmailData } from "./templates/welcome";
import { passwordResetEmail, PasswordResetEmailData } from "./templates/password-reset";
import { passwordChangedEmail, PasswordChangedEmailData } from "./templates/password-changed";
import { testEmail, TestEmailData } from "./templates/test-email";
import { leaveAppliedEmail, LeaveAppliedEmailData } from "./templates/leave-applied";
import { leaveApprovedEmail, LeaveApprovedEmailData } from "./templates/leave-approved";
import { leaveRejectedEmail, LeaveRejectedEmailData } from "./templates/leave-rejected";

// One entry per template — add a new file under templates/ and a new key
// here to add a template. Business services never call nodemailer/SES
// directly; they go through notifications.service.ts's notifyUser(...,
// { email: { template, data } }), which calls sendTemplateEmail below.
const TEMPLATES = {
  welcome: welcomeEmail,
  "password-reset": passwordResetEmail,
  "password-changed": passwordChangedEmail,
  "test-email": testEmail,
  "leave-applied": leaveAppliedEmail,
  "leave-approved": leaveApprovedEmail,
  "leave-rejected": leaveRejectedEmail,
} as const;

export type EmailTemplateName = keyof typeof TEMPLATES;

type TemplateDataMap = {
  welcome: WelcomeEmailData;
  "password-reset": PasswordResetEmailData;
  "password-changed": PasswordChangedEmailData;
  "test-email": TestEmailData;
  "leave-applied": LeaveAppliedEmailData;
  "leave-approved": LeaveApprovedEmailData;
  "leave-rejected": LeaveRejectedEmailData;
};

interface SendResult {
  success: boolean;
  error?: string;
}

// Best-effort by default (never throws) to match notifyUser's resilience
// contract — a broken SMTP/SES config must not fail the business operation
// it's attached to. sendTestEmail (below) opts back into surfacing the
// error, since a test send exists specifically to report failures.
async function send<T extends EmailTemplateName>(
  to: string,
  template: T,
  data: TemplateDataMap[T]
): Promise<SendResult> {
  try {
    const config = await getOrCreateConfiguration();
    const { transport, from } = resolveSender(config);
    const render = TEMPLATES[template];
    const { subject, html } = render(data as never, config.companyProfile);
    await transport.sendMail({ from, to, subject, html });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error sending email";
    logger.error({ err, to, template }, "Failed to send email");
    return { success: false, error: message };
  }
}

export async function sendTemplateEmail<T extends EmailTemplateName>(
  to: string,
  template: T,
  data: TemplateDataMap[T]
): Promise<void> {
  await send(to, template, data);
}

/** Used by the "Send Test Email" admin action — surfaces failures instead of swallowing them. */
export async function sendTestEmail(to: string, requestedBy: string): Promise<SendResult> {
  return send(to, "test-email", { requestedBy });
}
