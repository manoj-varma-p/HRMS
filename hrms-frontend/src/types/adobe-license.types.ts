export type AdobeLicenseColumnType = "text" | "date" | "tags" | "number";
export type AdobeLicenseAccessPermission = "view" | "edit";

export interface AdobeLicenseColumn {
  name: string;
  type: AdobeLicenseColumnType;
}

export interface AdobeLicenseSheet {
  id: string;
  title: string;
  columns: AdobeLicenseColumn[];
  rows: string[][];
  canEdit: boolean;
  canManageAccess: boolean;
  updatedAt: string;
}

export interface AdobeLicenseAccessUser {
  id: string;
  fullName: string;
  employeeId: string;
  email: string;
  permission: AdobeLicenseAccessPermission;
}
