import { Schema, model, Document } from "mongoose";

// Generic atomic counter (Mongo's standard auto-increment pattern via
// findOneAndUpdate + $inc) — the _id is the counter's name, e.g.
// "employeeId". Reused wherever the app needs a race-safe sequential
// number instead of a random/UUID-style id.
export interface ICounter extends Document<string> {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const CounterModel = model<ICounter>("Counter", counterSchema);
