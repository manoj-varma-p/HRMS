import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import {
  Configuration,
  CompanyProfile,
  OfficeSettings,
  LeavePolicy,
  NotificationSettings,
  SecuritySettings,
  GeneralSettings,
} from "@/types/configuration.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

export function getConfiguration() {
  return apiFetch<ApiSuccess<{ configuration: Configuration }>>(API_ENDPOINTS.CONFIGURATION.GET);
}

function patch(url: string, body: unknown): Promise<Configuration> {
  return apiFetch<ApiSuccess<{ configuration: Configuration }>>(url, {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((res) => res.data.configuration);
}

export function updateCompanyProfile(input: Partial<CompanyProfile>) {
  return patch(API_ENDPOINTS.CONFIGURATION.COMPANY_PROFILE, input);
}

export function updateOfficeSettings(input: Partial<OfficeSettings>) {
  return patch(API_ENDPOINTS.CONFIGURATION.OFFICE_SETTINGS, input);
}

export function updateLeavePolicy(input: Partial<LeavePolicy>) {
  return patch(API_ENDPOINTS.CONFIGURATION.LEAVE_POLICY, input);
}

export function updateNotificationSettings(input: Partial<NotificationSettings>) {
  return patch(API_ENDPOINTS.CONFIGURATION.NOTIFICATION_SETTINGS, input);
}

export interface EmailSettingsInput {
  provider?: "SMTP" | "SES";
  smtp?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    fromName?: string;
    fromEmail?: string;
  };
  ses?: {
    region?: string;
    accessKey?: string;
    secretKey?: string;
    verifiedSender?: string;
  };
}

export function updateEmailSettings(input: EmailSettingsInput) {
  return patch(API_ENDPOINTS.CONFIGURATION.EMAIL_SETTINGS, input);
}

export function sendTestEmail(to?: string) {
  return apiFetch<ApiSuccess<{ success: boolean; error?: string }>>(
    API_ENDPOINTS.CONFIGURATION.SEND_TEST_EMAIL,
    { method: "POST", body: JSON.stringify({ to }) }
  ).then((res) => res.data);
}

export function updateSecuritySettings(input: Partial<SecuritySettings>) {
  return patch(API_ENDPOINTS.CONFIGURATION.SECURITY_SETTINGS, input);
}

export function updateGeneralSettings(input: Partial<GeneralSettings>) {
  return patch(API_ENDPOINTS.CONFIGURATION.GENERAL_SETTINGS, input);
}
