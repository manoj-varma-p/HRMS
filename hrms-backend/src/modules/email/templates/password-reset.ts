import { ICompanyProfile } from "../../configuration/configuration.model";
import { escapeHtml, renderLayout, RenderedEmail } from "./base-layout";
import { button, codeBox } from "./helpers";

export interface PasswordResetEmailData {
  fullName: string;
  tempPassword: string;
  loginUrl: string;
}

export function passwordResetEmail(
  data: PasswordResetEmailData,
  companyProfile: ICompanyProfile
): RenderedEmail {
  const body = `
    <p style="font-size:16px;font-weight:600;margin:0 0 12px;">Hi ${escapeHtml(data.fullName)},</p>
    <p style="margin:0 0 12px;">An administrator reset your password. Use this temporary password to sign in:</p>
    ${codeBox("Temporary password", data.tempPassword)}
    <p style="margin:16px 0 0;">You'll be asked to set a new password the next time you sign in. If you didn't expect this, contact your administrator right away.</p>
    ${button("Sign in", data.loginUrl)}
  `;
  return {
    subject: "Your password has been reset",
    html: renderLayout(body, companyProfile),
  };
}
