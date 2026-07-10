"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AdministrationPageShell,
  CONFIGURATION_QUERY_KEY,
} from "@/features/administration/components/administration-page-shell";
import { SettingsSection } from "@/features/administration/components/settings-section";
import { SaveBar } from "@/features/administration/components/save-bar";
import { NumberInput } from "@/features/administration/components/number-input";
import { ToggleRow } from "@/features/administration/components/toggle-row";
import * as configurationService from "@/services/configuration.service";
import { Configuration, LeavePolicy } from "@/types/configuration.types";

export default function LeavePolicyPage() {
  return (
    <AdministrationPageShell
      title="Leave Policy"
      description="Leave application and approval logic uses these values automatically."
    >
      {(config) => <LeavePolicyForm key={config.updatedAt} config={config} />}
    </AdministrationPageShell>
  );
}

function LeavePolicyForm({ config }: { config: Configuration }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<LeavePolicy>(config.leavePolicy);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(config.leavePolicy),
    [draft, config.leavePolicy]
  );

  const mutation = useMutation({
    mutationFn: () => configurationService.updateLeavePolicy(draft),
    onSuccess: (updated) => {
      toast.success("Leave policy updated");
      queryClient.setQueryData(CONFIGURATION_QUERY_KEY, updated);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <SettingsSection title="Leave Quotas">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput
            id="sick-quota"
            label="Sick Leave Quota"
            suffix="days / year"
            value={draft.sickQuota}
            min={0}
            max={365}
            onChange={(sickQuota) => setDraft({ ...draft, sickQuota })}
          />
          <NumberInput
            id="casual-quota"
            label="Casual Leave Quota (per half-year)"
            suffix="days / half"
            value={draft.casualPaidQuotaPerHalf}
            min={0}
            max={180}
            onChange={(casualPaidQuotaPerHalf) => setDraft({ ...draft, casualPaidQuotaPerHalf })}
          />
          <NumberInput
            id="casual-notice"
            label="Casual Leave Advance Notice"
            suffix="day(s)"
            value={draft.casualPaidNoticeDays}
            min={0}
            max={90}
            onChange={(casualPaidNoticeDays) => setDraft({ ...draft, casualPaidNoticeDays })}
          />
          <NumberInput
            id="annual-accrual"
            label="Annual Leave Accrual"
            suffix="days / no-leave month"
            value={draft.annualAccrualPerMonth}
            min={0}
            max={10}
            step={0.25}
            onChange={(annualAccrualPerMonth) => setDraft({ ...draft, annualAccrualPerMonth })}
          />
          <NumberInput
            id="annual-notice"
            label="Annual Leave Advance Notice"
            suffix="day(s)"
            value={draft.annualNoticeDays}
            min={0}
            max={90}
            onChange={(annualNoticeDays) => setDraft({ ...draft, annualNoticeDays })}
          />
        </div>
        <ToggleRow
          id="unpaid-allowed"
          label="Allow Unpaid Leave"
          description="When off, employees cannot apply for unpaid leave."
          checked={draft.unpaidAllowed}
          onCheckedChange={(unpaidAllowed) => setDraft({ ...draft, unpaidAllowed })}
        />
        <ToggleRow
          id="carry-forward"
          label="Carry Forward Unused Leave"
          description="When on, Casual Leave days left unused in Jan–Jun carry into the Jul–Dec half. They don't carry further than that, and unused Annual/Sick days never carry into the next year."
          checked={draft.carryForwardEnabled}
          onCheckedChange={(carryForwardEnabled) => setDraft({ ...draft, carryForwardEnabled })}
        />
      </SettingsSection>

      <SettingsSection title="Duration Limits">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput
            id="min-duration"
            label="Minimum Leave Duration"
            suffix="working day(s)"
            value={draft.minDurationDays}
            min={1}
            max={365}
            onChange={(minDurationDays) => setDraft({ ...draft, minDurationDays })}
          />
          <NumberInput
            id="max-duration"
            label="Maximum Leave Duration"
            suffix="working day(s)"
            value={draft.maxDurationDays}
            min={1}
            max={365}
            onChange={(maxDurationDays) => setDraft({ ...draft, maxDurationDays })}
          />
        </div>
      </SettingsSection>

      <SaveBar
        visible={isDirty}
        isSaving={mutation.isPending}
        onSave={() => mutation.mutate()}
        onDiscard={() => setDraft(config.leavePolicy)}
      />
    </>
  );
}
