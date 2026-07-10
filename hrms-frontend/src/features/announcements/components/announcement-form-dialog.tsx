"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ANNOUNCEMENT_PRIORITY, AnnouncementPriority } from "@/constants/announcement";
import { Announcement } from "@/types/announcement.types";
import { PRIORITY_LABELS } from "../announcement-meta";

export interface AnnouncementFormValues {
  title: string;
  description: string;
  priority: AnnouncementPriority;
  expiryDate: string;
}

const EMPTY_FORM: AnnouncementFormValues = {
  title: "",
  description: "",
  priority: ANNOUNCEMENT_PRIORITY.MEDIUM,
  expiryDate: "",
};

function toFormValues(announcement?: Announcement | null): AnnouncementFormValues {
  if (!announcement) return EMPTY_FORM;
  return {
    title: announcement.title,
    description: announcement.description,
    priority: announcement.priority,
    expiryDate: announcement.expiryDate ?? "",
  };
}

export function AnnouncementFormDialog({
  open,
  onOpenChange,
  announcement,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: Announcement | null;
  isSaving: boolean;
  onSubmit: (values: AnnouncementFormValues) => void;
}) {
  const [values, setValues] = useState<AnnouncementFormValues>(() => toFormValues(announcement));

  const isEdit = Boolean(announcement);
  const isValid = values.title.trim().length >= 3 && values.description.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Announcement" : "New Announcement"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the announcement. Published announcements stay visible to employees."
              : "Announcements start as a draft — publish when you're ready for everyone to see it."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (isValid) onSubmit(values);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="announcement-title">Title</Label>
            <Input
              id="announcement-title"
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              placeholder="e.g. Office closed for maintenance"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="announcement-description">Description</Label>
            <Textarea
              id="announcement-description"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              placeholder="Details employees need to know"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <Select
                value={values.priority}
                onValueChange={(v) => setValues({ ...values, priority: v as AnnouncementPriority })}
              >
                <SelectTrigger aria-label="Priority">
                  <SelectValue>{(v: string) => PRIORITY_LABELS[v as AnnouncementPriority]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ANNOUNCEMENT_PRIORITY).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="announcement-expiry">Expiry date (optional)</Label>
              <Input
                id="announcement-expiry"
                type="date"
                value={values.expiryDate}
                onChange={(e) => setValues({ ...values, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
