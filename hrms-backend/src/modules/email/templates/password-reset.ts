import { ICompanyProfile } from "../../configuration/configuration.model";
import { escapeHtml, renderLayout, RenderedEmail } from "./base-layout";
import { button } from "./helpers";

export interface PasswordResetEmailData {
  fullName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function passwordResetEmail(
  data: PasswordResetEmailData,
  companyProfile: ICompanyProfile
): RenderedEmail {
  const body = `
    <p style="font-size:16px;font-weight:600;margin:0 0 12px;">Hi ${escapeHtml(data.fullName)},</p>
    <p style="margin:0 0 12px;">Click the button below to set a new password. This link expires in ${data.expiresInMinutes} minutes and can only be used once.</p>
    ${button("Set new password", data.resetUrl)}
    <p style="margin:16px 0 0;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
  `;
  return {
    subject: "Reset your password",
    html: renderLayout(body, companyProfile),
  };
}
