import { describe, it, expect } from "vitest";
import { ROLES } from "../../shared/constants/roles";
import { TASK_STATUS } from "../../shared/constants/taskTypes";
import {
  canChangeTaskStatus,
  canViewTask,
  isTaskOverdue,
  isTaskReopenTransition,
  isValidTaskStatusTransition,
} from "./task.util";

describe("isValidTaskStatusTransition", () => {
  it("allows every forward edge in the graph", () => {
    expect(isValidTaskStatusTransition(TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS)).toBe(true);
    expect(isValidTaskStatusTransition(TASK_STATUS.IN_PROGRESS, TASK_STATUS.IN_REVIEW)).toBe(true);
    expect(isValidTaskStatusTransition(TASK_STATUS.IN_REVIEW, TASK_STATUS.DONE)).toBe(true);
  });

  it("allows CANCELLED from every non-DONE, non-CANCELLED state", () => {
    expect(isValidTaskStatusTransition(TASK_STATUS.TODO, TASK_STATUS.CANCELLED)).toBe(true);
    expect(isValidTaskStatusTransition(TASK_STATUS.IN_PROGRESS, TASK_STATUS.CANCELLED)).toBe(true);
    expect(isValidTaskStatusTransition(TASK_STATUS.IN_REVIEW, TASK_STATUS.CANCELLED)).toBe(true);
  });

  it("rejects skipping ahead in the sequence", () => {
    expect(isValidTaskStatusTransition(TASK_STATUS.TODO, TASK_STATUS.IN_REVIEW)).toBe(false);
    expect(isValidTaskStatusTransition(TASK_STATUS.TODO, TASK_STATUS.DONE)).toBe(false);
  });

  it("rejects every backward edge except the DONE -> IN_PROGRESS reopen", () => {
    expect(isValidTaskStatusTransition(TASK_STATUS.IN_PROGRESS, TASK_STATUS.TODO)).toBe(false);
    expect(isValidTaskStatusTransition(TASK_STATUS.IN_REVIEW, TASK_STATUS.IN_PROGRESS)).toBe(false);
    expect(isValidTaskStatusTransition(TASK_STATUS.DONE, TASK_STATUS.IN_PROGRESS)).toBe(true);
  });

  it("rejects CANCELLED from DONE — a completed task cannot be cancelled", () => {
    expect(isValidTaskStatusTransition(TASK_STATUS.DONE, TASK_STATUS.CANCELLED)).toBe(false);
  });

  it("treats CANCELLED as fully terminal", () => {
    expect(isValidTaskStatusTransition(TASK_STATUS.CANCELLED, TASK_STATUS.TODO)).toBe(false);
    expect(isValidTaskStatusTransition(TASK_STATUS.CANCELLED, TASK_STATUS.IN_PROGRESS)).toBe(false);
  });

  it("rejects a no-op transition to the same status", () => {
    expect(isValidTaskStatusTransition(TASK_STATUS.TODO, TASK_STATUS.TODO)).toBe(false);
    expect(isValidTaskStatusTransition(TASK_STATUS.DONE, TASK_STATUS.DONE)).toBe(false);
  });
});

describe("isTaskReopenTransition", () => {
  it("is true only for DONE -> IN_PROGRESS", () => {
    expect(isTaskReopenTransition(TASK_STATUS.DONE, TASK_STATUS.IN_PROGRESS)).toBe(true);
  });

  it("is false for every other pair, including other DONE-adjacent ones", () => {
    expect(isTaskReopenTransition(TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE)).toBe(false);
    expect(isTaskReopenTransition(TASK_STATUS.DONE, TASK_STATUS.CANCELLED)).toBe(false);
    expect(isTaskReopenTransition(TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS)).toBe(false);
  });
});

describe("isTaskOverdue", () => {
  it("is never overdue with no due date", () => {
    expect(isTaskOverdue(null, TASK_STATUS.TODO, "2026-07-14")).toBe(false);
  });

  it("is overdue when the due date is strictly before today and the task is still open", () => {
    expect(isTaskOverdue("2026-07-01", TASK_STATUS.TODO, "2026-07-14")).toBe(true);
    expect(isTaskOverdue("2026-07-01", TASK_STATUS.IN_PROGRESS, "2026-07-14")).toBe(true);
  });

  it("is not overdue on the due date itself or before it", () => {
    expect(isTaskOverdue("2026-07-14", TASK_STATUS.TODO, "2026-07-14")).toBe(false);
    expect(isTaskOverdue("2026-07-20", TASK_STATUS.TODO, "2026-07-14")).toBe(false);
  });

  it("is never overdue once DONE or CANCELLED, no matter how late", () => {
    expect(isTaskOverdue("2020-01-01", TASK_STATUS.DONE, "2026-07-14")).toBe(false);
    expect(isTaskOverdue("2020-01-01", TASK_STATUS.CANCELLED, "2026-07-14")).toBe(false);
  });
});

describe("canViewTask", () => {
  const base = {
    actorId: "actor-1",
    actorRole: ROLES.EMPLOYEE,
    assignedTo: "assignee-1",
    assignedBy: "assigner-1",
    isDepartmentHeadOfTask: false,
  };

  it("always allows ADMIN and SUPER_ADMIN, regardless of relationship", () => {
    expect(canViewTask({ ...base, actorRole: ROLES.ADMIN })).toBe(true);
    expect(canViewTask({ ...base, actorRole: ROLES.SUPER_ADMIN })).toBe(true);
  });

  it("allows the assignee", () => {
    expect(canViewTask({ ...base, actorId: "assignee-1" })).toBe(true);
  });

  it("allows the assigner, even one who is no longer a department head or admin", () => {
    expect(canViewTask({ ...base, actorId: "assigner-1" })).toBe(true);
  });

  it("allows the department head of the task's department", () => {
    expect(canViewTask({ ...base, isDepartmentHeadOfTask: true })).toBe(true);
  });

  it("denies a plain employee with none of the three relationships", () => {
    expect(canViewTask({ ...base, actorId: "someone-else" })).toBe(false);
  });
});

describe("canChangeTaskStatus", () => {
  const base = {
    actorId: "assignee-1",
    actorRole: ROLES.EMPLOYEE,
    assignedTo: "assignee-1",
    isDepartmentHeadOfTask: false,
    from: TASK_STATUS.TODO,
    to: TASK_STATUS.IN_PROGRESS,
  };

  it("rejects an illegal transition even for a privileged actor", () => {
    expect(
      canChangeTaskStatus({ ...base, actorRole: ROLES.ADMIN, from: TASK_STATUS.TODO, to: TASK_STATUS.DONE })
    ).toBe(false);
  });

  it("lets the assignee drive their own task forward", () => {
    expect(canChangeTaskStatus(base)).toBe(true);
  });

  it("lets the assignee cancel their own task", () => {
    expect(canChangeTaskStatus({ ...base, to: TASK_STATUS.CANCELLED })).toBe(true);
  });

  it("denies a legal transition attempted by someone who isn't the assignee, admin, or department head", () => {
    expect(canChangeTaskStatus({ ...base, actorId: "someone-else" })).toBe(false);
  });

  it("denies the assignee reopening a DONE task", () => {
    expect(
      canChangeTaskStatus({
        ...base,
        from: TASK_STATUS.DONE,
        to: TASK_STATUS.IN_PROGRESS,
      })
    ).toBe(false);
  });

  it("lets admin and the department head reopen a DONE task", () => {
    expect(
      canChangeTaskStatus({
        ...base,
        actorId: "someone-else",
        actorRole: ROLES.ADMIN,
        from: TASK_STATUS.DONE,
        to: TASK_STATUS.IN_PROGRESS,
      })
    ).toBe(true);
    expect(
      canChangeTaskStatus({
        ...base,
        actorId: "someone-else",
        isDepartmentHeadOfTask: true,
        from: TASK_STATUS.DONE,
        to: TASK_STATUS.IN_PROGRESS,
      })
    ).toBe(true);
  });

  it("lets admin move a task forward even when admin isn't the assignee", () => {
    expect(canChangeTaskStatus({ ...base, actorId: "someone-else", actorRole: ROLES.ADMIN })).toBe(
      true
    );
  });
});
