"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import * as holidayService from "@/services/holiday.service";
import { Holiday, HolidayType } from "@/types/leave.types";
import { formatISTDate } from "@/lib/format-ist";

const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  NATIONAL: "National",
  COMPANY: "Company",
  OPTIONAL: "Optional",
};

interface FormState {
  date: string;
  name: string;
  description: string;
  type: HolidayType;
}

const EMPTY_FORM: FormState = { date: "", name: "", description: "", type: "COMPANY" };

export function HolidayManager() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [toggling, setToggling] = useState<Holiday | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["holidays", "all"],
    queryFn: () => holidayService.listHolidays({ includeInactive: true }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["holidays"] });

  const createMutation = useMutation({
    mutationFn: () => holidayService.createHoliday(addForm),
    onSuccess: () => {
      toast.success("Holiday created");
      invalidate();
      setAddOpen(false);
      setAddForm(EMPTY_FORM);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => holidayService.updateHoliday(editing!._id, editForm),
    onSuccess: () => {
      toast.success("Holiday updated");
      invalidate();
      setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: () =>
      toggling!.isActive
        ? holidayService.deactivateHoliday(toggling!._id)
        : holidayService.activateHoliday(toggling!._id),
    onSuccess: () => {
      toast.success(`Holiday ${toggling?.isActive ? "deactivated" : "activated"}`);
      invalidate();
      setToggling(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Holidays</h2>
          <p className="text-sm text-muted-foreground">
            National and company holidays recognized by attendance.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4" />
            Add Holiday
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Holiday</DialogTitle>
              <DialogDescription>Add a new national or company holiday.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="holiday-date">Date</Label>
                <Input
                  id="holiday-date"
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="holiday-name">Name</Label>
                <Input
                  id="holiday-name"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="holiday-description">Description (optional)</Label>
                <Textarea
                  id="holiday-description"
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select
                  value={addForm.type}
                  onValueChange={(v) => setAddForm({ ...addForm, type: v as HolidayType })}
                >
                  <SelectTrigger aria-label="Holiday type">
                    <SelectValue>{(v: string) => HOLIDAY_TYPE_LABELS[v as HolidayType]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NATIONAL">National</SelectItem>
                    <SelectItem value="COMPANY">Company</SelectItem>
                    <SelectItem value="OPTIONAL">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={
                  !addForm.date || addForm.name.trim().length < 2 || createMutation.isPending
                }
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                  No holidays added yet.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.map((h) => (
                <TableRow key={h._id}>
                  <TableCell className="font-medium">{formatISTDate(h.date)}</TableCell>
                  <TableCell>{h.name}</TableCell>
                  <TableCell>{HOLIDAY_TYPE_LABELS[h.type]}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        h.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent"
                          : "bg-muted text-muted-foreground border-transparent"
                      }
                    >
                      {h.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${h.name}`}
                      onClick={() => {
                        setEditing(h);
                        setEditForm({
                          date: h.date,
                          name: h.name,
                          description: h.description ?? "",
                          type: h.type,
                        });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={h.isActive ? "Deactivate" : "Activate"}
                      onClick={() => setToggling(h)}
                    >
                      {h.isActive ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Holiday</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-holiday-date">Date</Label>
              <Input
                id="edit-holiday-date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-holiday-name">Name</Label>
              <Input
                id="edit-holiday-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-holiday-description">Description (optional)</Label>
              <Textarea
                id="edit-holiday-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select
                value={editForm.type}
                onValueChange={(v) => setEditForm({ ...editForm, type: v as HolidayType })}
              >
                <SelectTrigger aria-label="Holiday type">
                  <SelectValue>{(v: string) => HOLIDAY_TYPE_LABELS[v as HolidayType]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIONAL">National</SelectItem>
                  <SelectItem value="COMPANY">Company</SelectItem>
                  <SelectItem value="OPTIONAL">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={editForm.name.trim().length < 2 || updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toggling !== null}
        onOpenChange={(open) => !open && setToggling(null)}
        title={toggling?.isActive ? "Deactivate holiday?" : "Activate holiday?"}
        description={
          toggling?.isActive
            ? `"${toggling?.name}" will no longer be recognized by attendance.`
            : `"${toggling?.name}" will be recognized by attendance again.`
        }
        confirmLabel={toggling?.isActive ? "Deactivate" : "Activate"}
        destructive={!!toggling?.isActive}
        isLoading={toggleMutation.isPending}
        onConfirm={() => toggleMutation.mutate()}
      />
    </div>
  );
}
