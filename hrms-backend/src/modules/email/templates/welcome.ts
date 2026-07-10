import { ICompanyProfile } from "../../configuration/configuration.model";
import { escapeHtml, renderLayout, RenderedEmail } from "./base-layout";
import { button, codeBox } from "./helpers";

export interface WelcomeEmailData {
  fullName: string;
  employeeId: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}

export function welcomeEmail(data: WelcomeEmailData, companyProfile: ICompanyProfile): RenderedEmail {
  const body = `
    <p style="font-size:16px;font-weight:600;margin:0 0 12px;">Welcome, ${escapeHtml(data.fullName)}!</p>
    <p style="margin:0 0 12px;">Your account has been created on ${escapeHtml(companyProfile.name)}'s HRMS. Here are your sign-in details:</p>
    ${codeBox("Employee ID", data.employeeId)}
    ${codeBox("Email", data.email)}
    ${codeBox("Temporary password", data.tempPassword)}
    <p style="margin:16px 0 0;">You'll be asked to set a new password the first time you sign in.</p>
    ${button("Sign in", data.loginUrl)}
  `;
  return {
    subject: `Welcome to ${companyProfile.name} — your account is ready`,
    html: renderLayout(body, companyProfile),
  };
}
