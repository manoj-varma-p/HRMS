"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AdministrationPageShell,
  CONFIGURATION_QUERY_KEY,
} from "@/features/administration/components/administration-page-shell";
import { SettingsSection } from "@/features/administration/components/settings-section";
import { SaveBar } from "@/features/administration/components/save-bar";
import { LogoUploader } from "@/features/administration/components/logo-uploader";
import * as configurationService from "@/services/configuration.service";
import { CompanyProfile, Configuration } from "@/types/configuration.types";

export default function CompanyProfilePage() {
  return (
    <AdministrationPageShell
      title="Company Profile"
      description="Your company's identity across the HRMS."
    >
      {(config) => <CompanyProfileForm key={config.updatedAt} config={config} />}
    </AdministrationPageShell>
  );
}

function CompanyProfileForm({ config }: { config: Configuration }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<CompanyProfile>(config.companyProfile);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(config.companyProfile),
    [draft, config.companyProfile]
  );

  const mutation = useMutation({
    mutationFn: () => configurationService.updateCompanyProfile(draft),
    onSuccess: (updated) => {
      toast.success("Company profile updated");
      queryClient.setQueryData(CONFIGURATION_QUERY_KEY, updated);
      // Name/logo also feed the nav's CompanyLogo, which reads a separate,
      // unauthenticated-endpoint-backed query key — kept in sync here
      // rather than making that public branding fetch admin-gated too.
      queryClient.invalidateQueries({ queryKey: ["company-branding"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <SettingsSection title="Company Details">
        <LogoUploader
          value={draft.logoUrl}
          onUploaded={(updated) => {
            queryClient.setQueryData(CONFIGURATION_QUERY_KEY, updated);
            queryClient.invalidateQueries({ queryKey: ["company-branding"] });
            setDraft((current) => ({ ...current, logoUrl: updated.companyProfile.logoUrl }));
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-timezone">Timezone</Label>
            <Input
              id="company-timezone"
              value={draft.timezone}
              onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
              placeholder="Asia/Kolkata"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-email">Company Email</Label>
            <Input
              id="company-email"
              type="email"
              value={draft.email ?? ""}
              onChange={(e) => setDraft({ ...draft, email: e.target.value || null })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-phone">Company Phone</Label>
            <Input
              id="company-phone"
              value={draft.phone ?? ""}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value || null })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company-website">Website</Label>
            <Input
              id="company-website"
              value={draft.website ?? ""}
              onChange={(e) => setDraft({ ...draft, website: e.target.value || null })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company-address">Address</Label>
          <Textarea
            id="company-address"
            value={draft.address ?? ""}
            onChange={(e) => setDraft({ ...draft, address: e.target.value || null })}
            rows={3}
          />
        </div>
      </SettingsSection>

      <SaveBar
        visible={isDirty}
        isSaving={mutation.isPending}
        onSave={() => mutation.mutate()}
        onDiscard={() => setDraft(config.companyProfile)}
      />
    </>
  );
}
