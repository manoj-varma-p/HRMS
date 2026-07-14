import { Schema, model, Document, Types } from "mongoose";
import { TASK_STATUS, TASK_PRIORITY, TaskStatus, TaskPriority } from "../../shared/constants/taskTypes";

export interface ITask extends Document {
  taskId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedBy: Types.ObjectId;
  assignedTo: Types.ObjectId;
  // Denormalized from assignedTo's department at creation time — lets
  // "list my team's tasks" be a single indexed query instead of a join
  // through User on every request. Deliberately NOT kept in sync if the
  // assignee later changes department: the task was assigned under that
  // team, and its historical team attribution shouldn't silently change
  // underneath it.
  department: Types.ObjectId | null;
  // Sub-tasks are one level deep by convention, enforced in
  // task.service.ts at creation time (a sub-task's own parentTask must be
  // null) — not schema-enforced here, since Mongoose can't express "this
  // ref's own ref must be null" declaratively.
  parentTask: Types.ObjectId | null;
  dueDate: string | null; // YYYY-MM-DD, matches LeaveRequest's date-string convention
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    taskId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: null, maxlength: 5000 },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      required: true,
      default: TASK_STATUS.TODO,
    },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      required: true,
      default: TASK_PRIORITY.MEDIUM,
    },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", default: null },
    parentTask: { type: Schema.Types.ObjectId, ref: "Task", default: null },
    dueDate: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ department: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ parentTask: 1 });
taskSchema.index({ dueDate: 1 });

export const TaskModel = model<ITask>("Task", taskSchema);
