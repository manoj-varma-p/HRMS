import { ICompanyProfile } from "../../configuration/configuration.model";
import { escapeHtml, renderLayout, RenderedEmail } from "./base-layout";

export interface TestEmailData {
  requestedBy: string;
}

export function testEmail(data: TestEmailData, companyProfile: ICompanyProfile): RenderedEmail {
  const body = `
    <p style="font-size:16px;font-weight:600;margin:0 0 12px;">This is a test email.</p>
    <p style="margin:0 0 12px;">If you're reading this, ${escapeHtml(companyProfile.name)}'s email settings are working correctly.</p>
    <p style="margin:16px 0 0;color:#6b7280;">Requested by ${escapeHtml(data.requestedBy)}.</p>
  `;
  return {
    subject: `Test email from ${companyProfile.name}`,
    html: renderLayout(body, companyProfile),
  };
}
