import Image from "next/image";
import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// URL-based, matching the existing employee profilePhoto pattern — there is
// no prior file-upload/S3 architecture in this codebase to reuse, and
// standing one up would mean provisioning real AWS infrastructure, which is
// explicitly out of scope for this phase (reserved for Phase 10). Paste a
// hosted image URL for now; swapping this for a real upload widget later
// only touches this one component.
export function LogoUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="company-logo-url">Company Logo URL</Label>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {value ? (
            <Image src={value} alt="Company logo" width={64} height={64} className="h-full w-full object-contain" unoptimized />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <Input
          id="company-logo-url"
          placeholder="https://..."
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="flex-1"
        />
      </div>
    </div>
  );
}
