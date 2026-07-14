"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAuth } from "@/hooks/use-auth";
import { ROLES } from "@/constants/roles";
import * as documentService from "@/services/document.service";
import { DocumentCategory, DocumentReviewStatus, EmployeeDocument } from "@/types/document.types";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  IDENTITY: "Identity",
  EDUCATION: "Education",
  EMPLOYMENT: "Employment",
  FINANCE: "Finance",
  OTHER: "Other",
};

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.docx";

const REVIEW_STATUS_LABELS: Record<DocumentReviewStatus, string> = {
  PENDING: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const REVIEW_STATUS_BADGE: Record<DocumentReviewStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent",
  APPROVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent",
  REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400 border-transparent",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPanel({ employeeId }: { employeeId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<DocumentCategory>("IDENTITY");
  const [progress, setProgress] = useState<number | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deleting, setDeleting] = useState<EmployeeDocument | null>(null);
  const [reviewing, setReviewing] = useState<{
    document: EmployeeDocument;
    action: "approve" | "reject";
  } | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  const canManage =
    !!user && (user.id === employeeId || user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN);
  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const queryKey = ["employee-documents", employeeId, showDeleted];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => documentService.listDocuments(employeeId, showDeleted),
    enabled: canManage,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["employee-documents", employeeId] });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }

    setProgress(0);
    try {
      await documentService.uploadDocument(employeeId, category, file, setProgress);
      toast.success("Document uploaded");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload document");
    } finally {
      setProgress(null);
    }
  }

  const downloadMutation = useMutation({
    mutationFn: (documentId: string) => documentService.getDownloadUrl(documentId),
    onSuccess: (url) => {
      window.open(url, "_blank", "noopener,noreferrer");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => documentService.deleteDocument(documentId),
    onSuccess: () => {
      toast.success("Document deleted");
      invalidate();
      setDeleting(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setDeleting(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (documentId: string) => documentService.restoreDocument(documentId),
    onSuccess: () => {
      toast.success("Document restored");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewing) return;
      return reviewing.action === "approve"
        ? documentService.approveDocument(reviewing.document.id, reviewComment || undefined)
        : documentService.rejectDocument(reviewing.document.id, reviewComment || undefined);
    },
    onSuccess: () => {
      toast.success(reviewing?.action === "approve" ? "Document approved" : "Document rejected");
      invalidate();
      setReviewing(null);
      setReviewComment("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!canManage) return null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Documents</h3>
          <p className="text-sm text-muted-foreground">
            Stored securely — files are never publicly accessible, only downloadable via a
            short-lived link generated for you.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Switch
                id={`show-deleted-${employeeId}`}
                checked={showDeleted}
                onCheckedChange={(checked) => setShowDeleted(checked === true)}
              />
              <Label htmlFor={`show-deleted-${employeeId}`} className="text-sm font-normal">
                Show deleted
              </Label>
            </div>
          )}
          <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
            <SelectTrigger aria-label="Document category" className="w-40">
              <SelectValue>{(v: string) => CATEGORY_LABELS[v as DocumentCategory]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>

      {progress !== null && <Progress value={progress} className="h-1.5" />}

      {isLoading && <Skeleton className="h-24 w-full" />}
      {!isLoading && isError && (
        <p className="text-sm text-destructive">Couldn&apos;t load documents.</p>
      )}
      {!isLoading && !isError && data?.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No documents yet.</p>
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{doc.originalFileName}</span>
                    {doc.status === "DELETED" && (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Deleted
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{CATEGORY_LABELS[doc.category]}</TableCell>
                  <TableCell>{formatFileSize(doc.fileSizeBytes)}</TableCell>
                  <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={REVIEW_STATUS_BADGE[doc.reviewStatus]}>
                      {REVIEW_STATUS_LABELS[doc.reviewStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {doc.status === "ACTIVE" ? (
                        <>
                          {isAdmin && doc.reviewStatus === "PENDING" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Approve ${doc.originalFileName}`}
                                onClick={() => setReviewing({ document: doc, action: "approve" })}
                              >
                                <Check className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Reject ${doc.originalFileName}`}
                                onClick={() => setReviewing({ document: doc, action: "reject" })}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Download ${doc.originalFileName}`}
                            disabled={downloadMutation.isPending}
                            onClick={() => downloadMutation.mutate(doc.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${doc.originalFileName}`}
                            onClick={() => setDeleting(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Restore ${doc.originalFileName}`}
                            disabled={restoreMutation.isPending}
                            onClick={() => restoreMutation.mutate(doc.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete document?"
        description={`"${deleting?.originalFileName}" will be removed from the list. ${isAdmin ? "It can be restored later." : "An admin can restore it if needed."}`}
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />

      <Dialog
        open={reviewing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReviewing(null);
            setReviewComment("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewing?.action === "approve" ? "Approve" : "Reject"} &quot;
              {reviewing?.document.originalFileName}&quot;
            </DialogTitle>
            <DialogDescription>
              {reviewing?.action === "approve"
                ? "The employee will be notified this document was accepted."
                : "Let the employee know what needs fixing — they'll see this comment."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="document-review-comment">Comment</Label>
            <Textarea
              id="document-review-comment"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={
                reviewing?.action === "reject" ? "e.g. Photo is blurry, please re-upload" : undefined
              }
            />
          </div>
          <DialogFooter>
            <Button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}>
              {reviewMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
