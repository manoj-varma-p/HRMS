"use client";

import { useState } from "react";
import { TaskList } from "@/features/tasks/components/task-list";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";

export default function TasksPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Tasks assigned to you — update status, comment, and share files.
        </p>
      </div>

      <TaskList onSelectTask={setSelectedTaskId} />

      <TaskDetailSheet
        taskId={selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      />
    </div>
  );
}
