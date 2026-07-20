"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileText, Loader2, Paperclip, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import * as taskService from "@/services/task.service";
import { TASK_POLL_INTERVAL_MS } from "../task-status-meta";
import { TaskEmptyState } from "./task-empty-state";

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.docx";
const MAX_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Employee scope for Phase 2: upload and download only — no delete button
// here, since "Delete attachment" is not in the employee "Allow ONLY" list
// even though the backend permits an uploader to delete their own.
export function TaskAttachmentPanel({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["task-attachments", taskId],
    queryFn: () => taskService.listAttachments(taskId),
    refetchInterval: TASK_POLL_INTERVAL_MS,
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast.error("File must be under 10MB");
      return;
    }

    setProgress(0);
    try {
      await taskService.uploadAttachment(taskId, file, setProgress);
      toast.success("Attachment uploaded");
      queryClient.invalidateQueries({ queryKey: ["task-attachments", taskId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload attachment");
    } finally {
      setProgress(null);
    }
  }

  const downloadMutation = useMutation({
    mutationFn: (attachmentId: string) => taskService.getAttachmentDownloadUrl(attachmentId),
    onSuccess: (url) => {
      window.open(url, "_blank", "noopener,noreferrer");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Attachments</h3>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={progress !== null}
          onClick={() => inputRef.current?.click()}
        >
          {progress !== null ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload
        </Button>
      </div>

      {progress !== null && <Progress value={progress} className="h-1.5" />}

      {isLoading && <Skeleton className="h-16 w-full" />}

      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-sm text-destructive">Couldn&apos;t load attachments.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && data?.length === 0 && (
        <TaskEmptyState message="No attachments yet." icon={Paperclip} />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {data.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {attachment.originalFileName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSizeBytes)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Download ${attachment.originalFileName}`}
                disabled={downloadMutation.isPending}
                onClick={() => downloadMutation.mutate(attachment.id)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
