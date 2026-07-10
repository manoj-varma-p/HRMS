"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AdministrationPageShell,
  CONFIGURATION_QUERY_KEY,
} from "@/features/administration/components/administration-page-shell";
import { SettingsSection } from "@/features/administration/components/settings-section";
import { SaveBar } from "@/features/administration/components/save-bar";
import * as configurationService from "@/services/configuration.service";
import { Configuration, GeneralSettings } from "@/types/configuration.types";

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
const TIME_FORMATS: { value: "12h" | "24h"; label: string }[] = [
  { value: "12h", label: "12-hour" },
  { value: "24h", label: "24-hour" },
];

export default function GeneralSettingsPage() {
  return (
    <AdministrationPageShell
      title="General Settings"
      description="Display defaults used throughout the application."
    >
      {(config) => <GeneralSettingsForm key={config.updatedAt} config={config} />}
    </AdministrationPageShell>
  );
}

function GeneralSettingsForm({ config }: { config: Configuration }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<GeneralSettings>(config.generalSettings);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(config.generalSettings),
    [draft, config.generalSettings]
  );

  const mutation = useMutation({
    mutationFn: () => configurationService.updateGeneralSettings(draft),
    onSuccess: (updated) => {
      toast.success("General settings updated");
      queryClient.setQueryData(CONFIGURATION_QUERY_KEY, updated);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <SettingsSection title="Display Defaults">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Date Format</Label>
            <Select
              value={draft.dateFormat}
              onValueChange={(v) => v && setDraft({ ...draft, dateFormat: v })}
            >
              <SelectTrigger aria-label="Date format">
                <SelectValue>{(v: string) => v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Time Format</Label>
            <Select
              value={draft.timeFormat}
              onValueChange={(v) => setDraft({ ...draft, timeFormat: v as "12h" | "24h" })}
            >
              <SelectTrigger aria-label="Time format">
                <SelectValue>
                  {(v: string) => TIME_FORMATS.find((f) => f.value === v)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIME_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              value={draft.currency}
              onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })}
              placeholder="INR"
              maxLength={10}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="default-timezone">Default Timezone</Label>
            <Input
              id="default-timezone"
              value={draft.defaultTimezone}
              onChange={(e) => setDraft({ ...draft, defaultTimezone: e.target.value })}
              placeholder="Asia/Kolkata"
            />
          </div>
        </div>
      </SettingsSection>

      <SaveBar
        visible={isDirty}
        isSaving={mutation.isPending}
        onSave={() => mutation.mutate()}
        onDiscard={() => setDraft(config.generalSettings)}
      />
    </>
  );
}
