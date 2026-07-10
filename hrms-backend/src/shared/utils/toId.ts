import { Document, Types } from "mongoose";

export function toId(doc: Document<Types.ObjectId>): string {
  return doc._id.toString();
}
