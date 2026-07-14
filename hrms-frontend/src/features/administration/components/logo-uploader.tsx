"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Building2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiAssetUrl } from "@/lib/api-client";
import * as configurationService from "@/services/configuration.service";
import { Configuration } from "@/types/configuration.types";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = "image/png,image/jpeg,image/webp,image/svg+xml";

// Uploads immediately on file selection — a file can't be "staged" as
// draft form state the way a text field can, so this manages its own
// mutation instead of going through the page's Save/Discard bar. Calls
// onUploaded with the fresh Configuration once the upload completes, so
// the parent stays in sync (query cache + its own draft) the same way
// every other settings mutation on this page does.
export function LogoUploader({
  value,
  onUploaded,
}: {
  value: string | null;
  onUploaded: (config: Configuration) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Logo must be under 2MB");
      return;
    }

    setProgress(0);
    try {
      const config = await configurationService.uploadCompanyLogo(file, setProgress);
      toast.success("Company logo updated");
      onUploaded(config);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload logo");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">Company Logo</span>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {value ? (
            <Image
              src={apiAssetUrl(value)}
              alt="Company logo"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              unoptimized
            />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
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
            className="w-fit"
            disabled={progress !== null}
            onClick={() => inputRef.current?.click()}
          >
            {progress !== null ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {value ? "Replace logo" : "Upload logo"}
          </Button>
          {progress !== null && <Progress value={progress} className="h-1.5 w-48" />}
          <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, or SVG. Up to 2MB.</p>
        </div>
      </div>
    </div>
  );
}
