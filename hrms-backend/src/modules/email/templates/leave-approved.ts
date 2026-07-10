import { ICompanyProfile } from "../../configuration/configuration.model";
import { escapeHtml, renderLayout, RenderedEmail } from "./base-layout";
import { codeBox } from "./helpers";

export interface LeaveApprovedEmailData {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  comment?: string | null;
}

export function leaveApprovedEmail(
  data: LeaveApprovedEmailData,
  companyProfile: ICompanyProfile
): RenderedEmail {
  const dateRange =
    data.startDate === data.endDate ? data.startDate : `${data.startDate} to ${data.endDate}`;
  const body = `
    <p style="font-size:16px;font-weight:600;margin:0 0 12px;">Hi ${escapeHtml(data.employeeName)},</p>
    <p style="margin:0 0 12px;">Your ${escapeHtml(data.leaveType)} leave request has been <strong style="color:#059669;">approved</strong>.</p>
    ${codeBox("Dates", `${dateRange} (${data.days} day${data.days === 1 ? "" : "s"})`)}
    ${data.comment ? codeBox("Admin comment", data.comment) : ""}
  `;
  return {
    subject: "Your leave request was approved",
    html: renderLayout(body, companyProfile),
  };
}
