import { escapeHtml } from "./base-layout";

export function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr>
    <td style="border-radius:6px;background-color:#111827;">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:10px 20px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

export function codeBox(label: string, value: string): string {
  return `<div style="margin:16px 0;">
  <div style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(label)}</div>
  <div style="margin-top:4px;padding:10px 14px;background-color:#f4f4f5;border-radius:6px;font-family:Consolas,Menlo,monospace;font-size:15px;font-weight:600;color:#111827;">${escapeHtml(value)}</div>
</div>`;
}
