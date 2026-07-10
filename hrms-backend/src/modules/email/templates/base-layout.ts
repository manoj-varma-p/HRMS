import { ICompanyProfile } from "../../configuration/configuration.model";

export interface RenderedEmail {
  subject: string;
  html: string;
}

// Escapes values interpolated into the HTML shell itself (company name,
// support email) — template bodies build their own markup and are
// responsible for escaping any further user-supplied strings they embed.
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * One shared shell (logo, company name, footer with support email/website)
 * every template renders its body into — the "all emails must share one
 * common layout" requirement, in one place instead of per-template.
 */
export function renderLayout(bodyHtml: string, companyProfile: ICompanyProfile): string {
  const name = escapeHtml(companyProfile.name);
  const logo = companyProfile.logoUrl
    ? `<img src="${escapeHtml(companyProfile.logoUrl)}" alt="${name}" height="32" style="display:block;" />`
    : `<span style="font-size:20px;font-weight:700;color:#111827;">${name}</span>`;
  const footerLinks = [
    companyProfile.email ? `<a href="mailto:${escapeHtml(companyProfile.email)}" style="color:#6b7280;text-decoration:underline;">${escapeHtml(companyProfile.email)}</a>` : null,
    companyProfile.website ? `<a href="${escapeHtml(companyProfile.website)}" style="color:#6b7280;text-decoration:underline;">${escapeHtml(companyProfile.website)}</a>` : null,
  ]
    .filter(Boolean)
    .join(" &middot; ");

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">${logo}</td>
            </tr>
            <tr>
              <td style="padding:32px;color:#111827;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;text-align:center;">
                <div>${name}</div>
                ${footerLinks ? `<div style="margin-top:4px;">${footerLinks}</div>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
