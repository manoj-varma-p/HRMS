"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format-relative-time";
import * as taskService from "@/services/task.service";
import { TASK_POLL_INTERVAL_MS } from "../task-status-meta";
import { TaskEmptyState } from "./task-empty-state";

// A single fetch of the most recent comments, reversed to chronological
// (oldest-first) order for display — matches the TDS's "newest-last"
// thread convention. No paginated comment UI in Phase 2 (not part of the
// employee-facing spec); 50 comments is a generous ceiling for a single
// task's discussion.
const COMMENT_FETCH_LIMIT = 50;

export function TaskCommentThread({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () =>
      taskService.listComments(taskId, { limit: COMMENT_FETCH_LIMIT }).then((res) => res.data),
    refetchInterval: TASK_POLL_INTERVAL_MS,
  });

  const addMutation = useMutation({
    mutationFn: (text: string) => taskService.addComment(taskId, text),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const comments = data ? [...data.comments].reverse() : [];

  function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    addMutation.mutate(trimmed);
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Comments</h3>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-sm text-destructive">Couldn&apos;t load comments.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && comments.length === 0 && (
        <TaskEmptyState message="No comments yet." icon={MessageSquare} />
      )}

      {!isLoading && !isError && comments.length > 0 && (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment.id} className="flex flex-col gap-0.5 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{comment.author.fullName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="Add a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          aria-label="Add a comment"
        />
        <Button
          size="sm"
          className="self-end"
          disabled={!body.trim() || addMutation.isPending}
          onClick={handleSubmit}
        >
          {addMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Post Comment
        </Button>
      </div>
    </div>
  );
}
