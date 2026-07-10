import { ICompanyProfile } from "../../configuration/configuration.model";
import { escapeHtml, renderLayout, RenderedEmail } from "./base-layout";

export interface PasswordChangedEmailData {
  fullName: string;
}

export function passwordChangedEmail(
  data: PasswordChangedEmailData,
  companyProfile: ICompanyProfile
): RenderedEmail {
  const body = `
    <p style="font-size:16px;font-weight:600;margin:0 0 12px;">Hi ${escapeHtml(data.fullName)},</p>
    <p style="margin:0 0 12px;">Your password was successfully changed.</p>
    <p style="margin:16px 0 0;">If you didn't make this change, contact your administrator immediately.</p>
  `;
  return {
    subject: "Your password was changed",
    html: renderLayout(body, companyProfile),
  };
}
