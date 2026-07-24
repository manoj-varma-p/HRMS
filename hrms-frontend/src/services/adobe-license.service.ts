import { apiFetch } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import {
  AdobeLicenseAccessPermission,
  AdobeLicenseAccessUser,
  AdobeLicenseColumn,
  AdobeLicenseSheet,
} from "@/types/adobe-license.types";

type ApiSuccess<T> = { success: true; message: string; data: T };

export function getSheet() {
  return apiFetch<ApiSuccess<{ sheet: AdobeLicenseSheet }>>(API_ENDPOINTS.ADOBE_LICENSES.GET).then(
    (res) => res.data.sheet
  );
}

export interface UpdateSheetInput {
  title?: string;
  columns?: AdobeLicenseColumn[];
  rows?: string[][];
}

export function updateSheet(input: UpdateSheetInput) {
  return apiFetch<ApiSuccess<{ sheet: AdobeLicenseSheet }>>(API_ENDPOINTS.ADOBE_LICENSES.UPDATE, {
    method: "PUT",
    body: JSON.stringify(input),
  }).then((res) => res.data.sheet);
}

export function myAccess() {
  return apiFetch<ApiSuccess<{ hasAccess: boolean; canEdit: boolean }>>(
    API_ENDPOINTS.ADOBE_LICENSES.ACCESS_ME
  ).then((res) => res.data);
}

export function listAccess() {
  return apiFetch<ApiSuccess<{ users: AdobeLicenseAccessUser[] }>>(
    API_ENDPOINTS.ADOBE_LICENSES.ACCESS_LIST
  ).then((res) => res.data.users);
}

export function grantAccess(userId: string, permission: AdobeLicenseAccessPermission) {
  return apiFetch<ApiSuccess<{ users: AdobeLicenseAccessUser[] }>>(
    API_ENDPOINTS.ADOBE_LICENSES.GRANT_ACCESS(userId),
    { method: "POST", body: JSON.stringify({ permission }) }
  ).then((res) => res.data.users);
}

export function revokeAccess(userId: string) {
  return apiFetch<ApiSuccess<{ users: AdobeLicenseAccessUser[] }>>(
    API_ENDPOINTS.ADOBE_LICENSES.REVOKE_ACCESS(userId),
    { method: "DELETE" }
  ).then((res) => res.data.users);
}
