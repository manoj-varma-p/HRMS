import { Schema, model, Document, Types } from "mongoose";

export type AdobeLicenseColumnType = "text" | "date" | "tags" | "number";
export type AdobeLicenseAccessPermission = "view" | "edit";

export interface IAdobeLicenseColumn {
  name: string;
  type: AdobeLicenseColumnType;
}

// Relationship, not a role — same shape as Department.headEmployeeId, just
// with a permission tier attached. "view" can read the sheet only; "edit"
// can also change it. Admin/Super Admin always get both, implicitly,
// without needing an entry here (see adobe-license.service.ts's
// resolveAccess).
export interface IAdobeLicenseAccessGrant {
  user: Types.ObjectId;
  permission: AdobeLicenseAccessPermission;
}

// Single shared sheet, not a per-record collection — mirrors
// configuration.model.ts's singleton pattern (fixed unique `key`, found via
// getOrCreateSheet() in the service, never a second document created).
export interface IAdobeLicenseSheet extends Document {
  key: string;
  title: string;
  columns: IAdobeLicenseColumn[];
  rows: string[][];
  accessGrants: IAdobeLicenseAccessGrant[];
  updatedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const columnSchema = new Schema<IAdobeLicenseColumn>(
  {
    // Not required: a blank header is a legitimate transient state (a user
    // clearing it mid-rename) — the UI falls back to "Column N" for
    // display, so the schema shouldn't reject an empty string here.
    name: { type: String, default: "", trim: true, maxlength: 200 },
    type: {
      type: String,
      required: true,
      enum: ["text", "date", "tags", "number"],
      default: "text",
    },
  },
  { _id: false }
);

const accessGrantSchema = new Schema<IAdobeLicenseAccessGrant>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    permission: { type: String, required: true, enum: ["view", "edit"], default: "view" },
  },
  { _id: false }
);

const adobeLicenseSheetSchema = new Schema<IAdobeLicenseSheet>(
  {
    key: { type: String, required: true, unique: true, default: "singleton" },
    title: { type: String, required: true, default: "Adobe Licenses", trim: true, maxlength: 200 },
    columns: { type: [columnSchema], required: true, default: () => [] },
    rows: { type: [[String]], required: true, default: () => [] },
    accessGrants: { type: [accessGrantSchema], required: true, default: () => [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export const AdobeLicenseSheetModel = model<IAdobeLicenseSheet>(
  "AdobeLicenseSheet",
  adobeLicenseSheetSchema
);
