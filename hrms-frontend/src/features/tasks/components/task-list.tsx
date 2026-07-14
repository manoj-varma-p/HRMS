"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import * as taskService from "@/services/task.service";
import { TaskPriority, TaskStatus } from "@/types/task.types";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "../task-status-meta";
import { TaskCard } from "./task-card";
import { TaskListSkeleton } from "./task-list-skeleton";
import { TaskEmptyState } from "./task-empty-state";

const ALL = "ALL";
const PAGE_SIZE = 10;

export function TaskList({ onSelectTask }: { onSelectTask: (taskId: string) => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | undefined>(undefined);
  const [priority, setPriority] = useState<TaskPriority | undefined>(undefined);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-tasks", debouncedSearch, status, priority, page],
    queryFn: () =>
      taskService
        .myTasks({
          search: debouncedSearch || undefined,
          status,
          priority,
          page,
          limit: PAGE_SIZE,
        })
        .then((res) => res.data),
  });

  const hasActiveFilters = Boolean(search || status || priority);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search my tasks"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status ?? ALL}
            onValueChange={(v) => {
              setStatus(v === ALL ? undefined : (v as TaskStatus));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40" aria-label="Filter by status">
              <SelectValue placeholder="Status">
                {(v: string) => (v === ALL ? "All Statuses" : TASK_STATUS_LABELS[v as TaskStatus])}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Statuses</SelectItem>
              {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priority ?? ALL}
            onValueChange={(v) => {
              setPriority(v === ALL ? undefined : (v as TaskPriority));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40" aria-label="Filter by priority">
              <SelectValue placeholder="Priority">
                {(v: string) =>
                  v === ALL ? "All Priorities" : TASK_PRIORITY_LABELS[v as TaskPriority]
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Priorities</SelectItem>
              {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <TaskListSkeleton />}

      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm text-destructive">Couldn&apos;t load your tasks.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (data?.tasks.length ?? 0) === 0 && (
        <TaskEmptyState
          message={hasActiveFilters ? "No tasks match your filters." : "No tasks assigned to you yet."}
        />
      )}

      {!isLoading && !isError && data && data.tasks.length > 0 && (
        <div className="flex flex-col gap-3">
          {data.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onSelectTask(task.id)} />
          ))}
        </div>
      )}

      {data && data.pagination.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total}{" "}
            tasks
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
