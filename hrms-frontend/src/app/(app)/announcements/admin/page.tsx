"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Archive, Megaphone, Pencil, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleGuard } from "@/components/layout/role-guard";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { ANNOUNCEMENT_STATUS } from "@/constants/announcement";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import * as announcementService from "@/services/announcement.service";
import { ReportSearchInput } from "@/features/reports/components/filters/report-search-input";
import { ReportPagination } from "@/features/reports/components/report-pagination";
import { AnnouncementCard } from "@/features/announcements/components/announcement-card";
import {
  AnnouncementFormDialog,
  AnnouncementFormValues,
} from "@/features/announcements/components/announcement-form-dialog";
import { STATUS_LABELS } from "@/features/announcements/announcement-meta";
import { Announcement } from "@/types/announcement.types";
import { useRouter } from "next/navigation";

const ALL = "ALL";

function toFilterValue(v: string | null): string | undefined {
  return v && v !== ALL ? v : undefined;
}

export default function AnnouncementsAdminPage() {
  return (
    <RoleGuard allow={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
      <AnnouncementsAdminPageContent />
    </RoleGuard>
  );
}

function AnnouncementsAdminPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [archiving, setArchiving] = useState<Announcement | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["announcements-admin", { search: debouncedSearch, status, page }],
    queryFn: () =>
      announcementService
        .adminListAnnouncements({ search: debouncedSearch, status, page, limit: 10 })
        .then((res) => res.data),
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["announcements-admin"] });
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
    queryClient.invalidateQueries({ queryKey: ["announcements-recent"] });
  }

  const createMutation = useMutation({
    mutationFn: (values: AnnouncementFormValues) =>
      announcementService.createAnnouncement({
        title: values.title,
        description: values.description,
        priority: values.priority,
        expiryDate: values.expiryDate || undefined,
      }),
    onSuccess: () => {
      toast.success("Announcement created as draft");
      invalidateAll();
      setFormOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (values: AnnouncementFormValues) =>
      announcementService.updateAnnouncement(editing!.id, {
        title: values.title,
        description: values.description,
        priority: values.priority,
        expiryDate: values.expiryDate || null,
      }),
    onSuccess: () => {
      toast.success("Announcement updated");
      invalidateAll();
      setFormOpen(false);
      setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => announcementService.publishAnnouncement(id),
    onSuccess: () => {
      toast.success("Announcement published");
      invalidateAll();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => announcementService.archiveAnnouncement(id),
    onSuccess: () => {
      toast.success("Announcement archived");
      invalidateAll();
      setArchiving(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={() => router.push(ROUTES.ANNOUNCEMENTS)}>
        <ArrowLeft className="h-4 w-4" />
        Back to Announcements
      </Button>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Announcements</h1>
          <p className="text-sm text-muted-foreground">Create, edit, publish, and archive announcements.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <ReportSearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search announcements"
        />
        <Select
          value={status ?? ALL}
          onValueChange={(v) => {
            setStatus(toFilterValue(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
            <SelectValue placeholder="Status">
              {(v: string) => (v === ALL ? "All Statuses" : STATUS_LABELS[v as keyof typeof STATUS_LABELS])}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Statuses</SelectItem>
            {Object.values(ANNOUNCEMENT_STATUS).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}

        {!isLoading && isError && (
          <p className="text-sm text-destructive">Couldn&apos;t load announcements. Please try again.</p>
        )}

        {!isLoading && !isError && (data?.announcements.length ?? 0) === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No announcements found</p>
            <p className="text-sm text-muted-foreground">Create one to get started.</p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          data?.announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              showStatus
              truncate
              actions={
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit"
                    onClick={() => {
                      setEditing(a);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {a.status !== ANNOUNCEMENT_STATUS.PUBLISHED && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Publish"
                      disabled={publishMutation.isPending}
                      onClick={() => publishMutation.mutate(a.id)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  {a.status !== ANNOUNCEMENT_STATUS.ARCHIVED && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Archive"
                      onClick={() => setArchiving(a)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                </>
              }
            />
          ))}
      </div>

      {data?.pagination && (
        <ReportPagination pagination={data.pagination} onPageChange={setPage} itemLabel="announcements" />
      )}

      <AnnouncementFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        announcement={editing}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onSubmit={(values) => (editing ? updateMutation.mutate(values) : createMutation.mutate(values))}
      />

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(open) => !open && setArchiving(null)}
        title="Archive announcement?"
        description={`"${archiving?.title}" will no longer be visible to employees.`}
        confirmLabel="Archive"
        destructive
        isLoading={archiveMutation.isPending}
        onConfirm={() => archiving && archiveMutation.mutate(archiving.id)}
      />
    </div>
  );
}
