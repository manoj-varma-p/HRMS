import { Schema, model, Document, Types } from "mongoose";

// A separate collection rather than an array embedded on Task — a busy
// task could accumulate an unbounded number of comments, which would risk
// Task documents growing without bound and would make every task-list
// read pay for comment data even when it isn't needed. Matches how
// LeaveBalance is its own collection rather than embedded on User.
export interface ITaskComment extends Document {
  task: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskCommentSchema = new Schema<ITaskComment>(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

taskCommentSchema.index({ task: 1, createdAt: -1 });

export const TaskCommentModel = model<ITaskComment>("TaskComment", taskCommentSchema);
