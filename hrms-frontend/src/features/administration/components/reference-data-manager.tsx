"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ReferenceData } from "@/types/employee.types";

interface ReferenceDataService {
  list: (includeInactive?: boolean) => Promise<ReferenceData[]>;
  create: (name: string) => Promise<ReferenceData>;
  update: (id: string, name: string) => Promise<ReferenceData>;
  activate: (id: string) => Promise<ReferenceData>;
  deactivate: (id: string) => Promise<ReferenceData>;
}

interface ReferenceDataManagerProps {
  title: string;
  description: string;
  itemLabel: string;
  queryKey: string;
  service: ReferenceDataService;
  // Optional extra column, rendered after Status and before Actions.
  // Undefined (every consumer except Departments today) renders this
  // table exactly as before — Designation's page doesn't pass this prop,
  // so its behavior is unchanged.
  extraColumn?: {
    header: string;
    render: (item: ReferenceData) => React.ReactNode;
  };
}

export function ReferenceDataManager({
  title,
  description,
  itemLabel,
  queryKey,
  service,
  extraColumn,
}: ReferenceDataManagerProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [editing, setEditing] = useState<ReferenceData | null>(null);
  const [editName, setEditName] = useState("");
  const [toggling, setToggling] = useState<ReferenceData | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, "all"],
    queryFn: () => service.list(true),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [queryKey] });

  const createMutation = useMutation({
    mutationFn: () => service.create(addName.trim()),
    onSuccess: () => {
      toast.success(`${itemLabel} created`);
      invalidate();
      setAddOpen(false);
      setAddName("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => service.update(editing!._id, editName.trim()),
    onSuccess: () => {
      toast.success(`${itemLabel} updated`);
      invalidate();
      setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: () =>
      toggling!.isActive ? service.deactivate(toggling!._id) : service.activate(toggling!._id),
    onSuccess: () => {
      toast.success(`${itemLabel} ${toggling?.isActive ? "deactivated" : "activated"}`);
      invalidate();
      setToggling(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4" />
            Add {itemLabel}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add {itemLabel}</DialogTitle>
              <DialogDescription>
                Give the new {itemLabel.toLowerCase()} a name.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ref-name">Name</Label>
              <Input
                id="ref-name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={addName.trim().length < 2 || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
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
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              {extraColumn && <TableHead>{extraColumn.header}</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={extraColumn ? 4 : 3}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={extraColumn ? 4 : 3}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No {itemLabel.toLowerCase()}s yet.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        item.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent"
                          : "bg-muted text-muted-foreground border-transparent"
                      }
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {extraColumn && <TableCell>{extraColumn.render(item)}</TableCell>}
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${item.name}`}
                      onClick={() => {
                        setEditing(item);
                        setEditName(item.name);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={item.isActive ? "Deactivate" : "Activate"}
                      onClick={() => setToggling(item)}
                    >
                      {item.isActive ? (
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
            <DialogTitle>Edit {itemLabel}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-ref-name">Name</Label>
            <Input
              id="edit-ref-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={editName.trim().length < 2 || updateMutation.isPending}
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
        title={toggling?.isActive ? `Deactivate ${itemLabel.toLowerCase()}?` : `Activate ${itemLabel.toLowerCase()}?`}
        description={
          toggling?.isActive
            ? `"${toggling?.name}" will no longer be selectable for employees.`
            : `"${toggling?.name}" will become selectable for employees again.`
        }
        confirmLabel={toggling?.isActive ? "Deactivate" : "Activate"}
        destructive={!!toggling?.isActive}
        isLoading={toggleMutation.isPending}
        onConfirm={() => toggleMutation.mutate()}
      />
    </div>
  );
}
