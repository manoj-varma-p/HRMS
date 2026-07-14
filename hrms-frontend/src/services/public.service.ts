import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

type ApiSuccess<T> = { success: true; message: string; data: T };

export interface CompanyBranding {
  name: string;
  logoUrl: string | null;
}

// Unauthenticated on the backend, but still routed through apiFetch (which
// attaches the token when one exists) since every caller here is already
// inside the authenticated app shell — no need for a second fetch helper.
export function getCompanyBranding() {
  return apiFetch<ApiSuccess<CompanyBranding>>(API_ENDPOINTS.PUBLIC.COMPANY_BRANDING).then(
    (res) => res.data
  );
}
