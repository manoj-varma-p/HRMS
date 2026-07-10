import { ICompanyProfile } from "../../configuration/configuration.model";
import { escapeHtml, renderLayout, RenderedEmail } from "./base-layout";
import { button, codeBox } from "./helpers";

export interface LeaveAppliedEmailData {
  employeeName: string;
  employeeIdLabel: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  reviewUrl: string;
}

export function leaveAppliedEmail(
  data: LeaveAppliedEmailData,
  companyProfile: ICompanyProfile
): RenderedEmail {
  const dateRange =
    data.startDate === data.endDate ? data.startDate : `${data.startDate} to ${data.endDate}`;
  const body = `
    <p style="font-size:16px;font-weight:600;margin:0 0 12px;">New leave request awaiting review</p>
    <p style="margin:0 0 12px;">${escapeHtml(data.employeeName)} (${escapeHtml(data.employeeIdLabel)}) applied for ${escapeHtml(data.leaveType)} leave.</p>
    ${codeBox("Dates", `${dateRange} (${data.days} day${data.days === 1 ? "" : "s"})`)}
    ${codeBox("Reason", data.reason)}
    <p style="margin:16px 0 0;">Sign in to approve or reject this request.</p>
    ${button("Review Request", data.reviewUrl)}
  `;
  return {
    subject: `Leave request from ${data.employeeName}`,
    html: renderLayout(body, companyProfile),
  };
}
