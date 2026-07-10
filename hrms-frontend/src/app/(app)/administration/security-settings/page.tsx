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
import { Configuration, SecuritySettings } from "@/types/configuration.types";

export default function SecuritySettingsPage() {
  return (
    <AdministrationPageShell
      title="Security Settings"
      description="Authentication reads these values on every login and token issue — changes apply immediately."
    >
      {(config) => <SecuritySettingsForm key={config.updatedAt} config={config} />}
    </AdministrationPageShell>
  );
}

function SecuritySettingsForm({ config }: { config: Configuration }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SecuritySettings>(config.securitySettings);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(config.securitySettings),
    [draft, config.securitySettings]
  );

  const mutation = useMutation({
    mutationFn: () => configurationService.updateSecuritySettings(draft),
    onSuccess: (updated) => {
      toast.success("Security settings updated");
      queryClient.setQueryData(CONFIGURATION_QUERY_KEY, updated);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <SettingsSection title="Password Policy">
        <NumberInput
          id="min-password-length"
          label="Minimum Password Length"
          suffix="characters"
          value={draft.minPasswordLength}
          min={6}
          max={128}
          onChange={(minPasswordLength) => setDraft({ ...draft, minPasswordLength })}
        />
        <ToggleRow
          id="password-complexity"
          label="Require Password Complexity"
          description="Uppercase, lowercase, a number, and a symbol."
          checked={draft.passwordComplexity}
          onCheckedChange={(passwordComplexity) => setDraft({ ...draft, passwordComplexity })}
        />
      </SettingsSection>

      <SettingsSection title="Login Lockout">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput
            id="max-login-attempts"
            label="Maximum Login Attempts"
            value={draft.maxLoginAttempts}
            min={3}
            max={20}
            onChange={(maxLoginAttempts) => setDraft({ ...draft, maxLoginAttempts })}
          />
          <NumberInput
            id="lockout-duration"
            label="Lockout Duration"
            suffix="minutes"
            value={draft.lockoutDurationMinutes}
            min={1}
            max={1440}
            onChange={(lockoutDurationMinutes) => setDraft({ ...draft, lockoutDurationMinutes })}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Sessions & Tokens">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput
            id="session-timeout"
            label="Session Timeout"
            suffix="minutes"
            value={draft.sessionTimeoutMinutes}
            min={5}
            max={43200}
            onChange={(sessionTimeoutMinutes) => setDraft({ ...draft, sessionTimeoutMinutes })}
            description="How long the browser keeps a session before requiring login again."
          />
          <NumberInput
            id="access-token-lifetime"
            label="Access Token Lifetime"
            suffix="minutes"
            value={draft.accessTokenLifetimeMinutes}
            min={1}
            max={1440}
            onChange={(accessTokenLifetimeMinutes) => setDraft({ ...draft, accessTokenLifetimeMinutes })}
          />
          <NumberInput
            id="refresh-token-lifetime"
            label="Refresh Token Lifetime"
            suffix="days"
            value={draft.refreshTokenLifetimeDays}
            min={1}
            max={90}
            onChange={(refreshTokenLifetimeDays) => setDraft({ ...draft, refreshTokenLifetimeDays })}
          />
        </div>
      </SettingsSection>

      <SaveBar
        visible={isDirty}
        isSaving={mutation.isPending}
        onSave={() => mutation.mutate()}
        onDiscard={() => setDraft(config.securitySettings)}
      />
    </>
  );
}
