"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  AdministrationPageShell,
  CONFIGURATION_QUERY_KEY,
} from "@/features/administration/components/administration-page-shell";
import { SettingsSection } from "@/features/administration/components/settings-section";
import { SaveBar } from "@/features/administration/components/save-bar";
import { NumberInput } from "@/features/administration/components/number-input";
import * as configurationService from "@/services/configuration.service";
import { Configuration, EmailProvider } from "@/types/configuration.types";

const PROVIDER_LABELS: Record<EmailProvider, string> = { SMTP: "SMTP", SES: "AWS SES" };

interface EmailDraft {
  provider: EmailProvider;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromName: string;
  smtpFromEmail: string;
  sesRegion: string;
  sesAccessKey: string;
  sesSecretKey: string;
  sesVerifiedSender: string;
}

function toDraft(config: Configuration): EmailDraft {
  const { smtp, ses, provider } = config.emailSettings;
  return {
    provider,
    smtpHost: smtp.host ?? "",
    smtpPort: smtp.port ?? 587,
    smtpUsername: smtp.username ?? "",
    smtpPassword: "",
    smtpFromName: smtp.fromName ?? "",
    smtpFromEmail: smtp.fromEmail ?? "",
    sesRegion: ses.region ?? "",
    sesAccessKey: "",
    sesSecretKey: "",
    sesVerifiedSender: ses.verifiedSender ?? "",
  };
}

export default function EmailSettingsPage() {
  return (
    <AdministrationPageShell
      title="Email Settings"
      description="Credentials are encrypted at rest and never displayed once saved. Save your changes before sending a test email."
    >
      {(config) => <EmailSettingsForm key={config.updatedAt} config={config} />}
    </AdministrationPageShell>
  );
}

function EmailSettingsForm({ config }: { config: Configuration }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<EmailDraft>(() => toDraft(config));
  const original = useMemo(() => toDraft(config), [config]);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(original), [draft, original]);

  const mutation = useMutation({
    mutationFn: () =>
      configurationService.updateEmailSettings({
        provider: draft.provider,
        smtp: {
          host: draft.smtpHost,
          port: draft.smtpPort,
          username: draft.smtpUsername,
          fromName: draft.smtpFromName,
          fromEmail: draft.smtpFromEmail,
          ...(draft.smtpPassword ? { password: draft.smtpPassword } : {}),
        },
        ses: {
          region: draft.sesRegion,
          verifiedSender: draft.sesVerifiedSender,
          ...(draft.sesAccessKey ? { accessKey: draft.sesAccessKey } : {}),
          ...(draft.sesSecretKey ? { secretKey: draft.sesSecretKey } : {}),
        },
      }),
    onSuccess: (updated) => {
      toast.success("Email settings updated");
      queryClient.setQueryData(CONFIGURATION_QUERY_KEY, updated);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <SettingsSection title="Provider">
        <div className="flex flex-col gap-1.5">
          <Label>Email Provider</Label>
          <Select
            value={draft.provider}
            onValueChange={(v) => setDraft({ ...draft, provider: v as EmailProvider })}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Email provider">
              <SelectValue>{(v: string) => PROVIDER_LABELS[v as EmailProvider]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SMTP">SMTP</SelectItem>
              <SelectItem value="SES">AWS SES</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingsSection>

      <SettingsSection title="SMTP Configuration">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="smtp-host">SMTP Host</Label>
            <Input id="smtp-host" value={draft.smtpHost} onChange={(e) => setDraft({ ...draft, smtpHost: e.target.value })} />
          </div>
          <NumberInput
            id="smtp-port"
            label="SMTP Port"
            value={draft.smtpPort}
            min={1}
            max={65535}
            onChange={(smtpPort) => setDraft({ ...draft, smtpPort })}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="smtp-username">Username</Label>
            <Input
              id="smtp-username"
              value={draft.smtpUsername}
              onChange={(e) => setDraft({ ...draft, smtpUsername: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="smtp-password">
              Password {config.emailSettings.smtp.hasPassword && <span className="text-muted-foreground">(saved — leave blank to keep)</span>}
            </Label>
            <Input
              id="smtp-password"
              type="password"
              value={draft.smtpPassword}
              onChange={(e) => setDraft({ ...draft, smtpPassword: e.target.value })}
              placeholder={config.emailSettings.smtp.hasPassword ? "••••••••" : ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="smtp-from-name">From Name</Label>
            <Input
              id="smtp-from-name"
              value={draft.smtpFromName}
              onChange={(e) => setDraft({ ...draft, smtpFromName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="smtp-from-email">From Email</Label>
            <Input
              id="smtp-from-email"
              type="email"
              value={draft.smtpFromEmail}
              onChange={(e) => setDraft({ ...draft, smtpFromEmail: e.target.value })}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="AWS SES Configuration">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ses-region">Region</Label>
            <Input
              id="ses-region"
              value={draft.sesRegion}
              onChange={(e) => setDraft({ ...draft, sesRegion: e.target.value })}
              placeholder="us-east-1"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ses-verified-sender">Verified Sender</Label>
            <Input
              id="ses-verified-sender"
              type="email"
              value={draft.sesVerifiedSender}
              onChange={(e) => setDraft({ ...draft, sesVerifiedSender: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ses-access-key">
              Access Key {config.emailSettings.ses.hasAccessKey && <span className="text-muted-foreground">(saved — leave blank to keep)</span>}
            </Label>
            <Input
              id="ses-access-key"
              type="password"
              value={draft.sesAccessKey}
              onChange={(e) => setDraft({ ...draft, sesAccessKey: e.target.value })}
              placeholder={config.emailSettings.ses.hasAccessKey ? "••••••••" : ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ses-secret-key">
              Secret Key {config.emailSettings.ses.hasSecretKey && <span className="text-muted-foreground">(saved — leave blank to keep)</span>}
            </Label>
            <Input
              id="ses-secret-key"
              type="password"
              value={draft.sesSecretKey}
              onChange={(e) => setDraft({ ...draft, sesSecretKey: e.target.value })}
              placeholder={config.emailSettings.ses.hasSecretKey ? "••••••••" : ""}
            />
          </div>
        </div>
      </SettingsSection>

      <SendTestEmailSection disabled={isDirty} />

      <SaveBar
        visible={isDirty}
        isSaving={mutation.isPending}
        onSave={() => mutation.mutate()}
        onDiscard={() => setDraft(original)}
      />
    </>
  );
}

function SendTestEmailSection({ disabled }: { disabled: boolean }) {
  const [to, setTo] = useState("");

  const mutation = useMutation({
    mutationFn: () => configurationService.sendTestEmail(to || undefined),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Test email sent — check the inbox");
      } else {
        toast.error(result.error ?? "Failed to send test email");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <SettingsSection
      title="Send Test Email"
      description={disabled ? "Save your changes above first." : "Sends using the settings currently saved for this provider."}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="test-email-to">Send to (optional — defaults to your own email)</Label>
          <Input
            id="test-email-to"
            type="email"
            placeholder="you@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={disabled || mutation.isPending}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Send Test Email
        </Button>
      </div>
    </SettingsSection>
  );
}
