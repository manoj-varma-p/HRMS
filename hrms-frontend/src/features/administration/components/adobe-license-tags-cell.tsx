"use client";

import { useState } from "react";
import { X } from "lucide-react";

// A "tags" column stores its cell as a JSON-encoded string[] inside the
// same string cell every other column type uses — the sheet/database shape
// never changes, only how this one cell renders. Any plain string entered
// before the column was switched to "tags" (or a malformed value) falls
// back to a single one-tag list instead of losing the data.
export function parseTags(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === "string" && v.trim() !== "");
    }
  } catch {
    return [raw];
  }
  return [];
}

export function serializeTags(tags: string[]): string {
  return JSON.stringify(tags);
}

export function TagsCell({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
}) {
  const tags = parseTags(value);
  const [draftTag, setDraftTag] = useState("");

  function commitDraftTag() {
    const trimmed = draftTag.trim();
    if (!trimmed) return;
    onChange(serializeTags([...tags, trimmed]));
    setDraftTag("");
  }

  function removeTag(index: number) {
    onChange(serializeTags(tags.filter((_, i) => i !== index)));
  }

  return (
    <div className="flex min-h-8 flex-wrap items-center gap-1 rounded-md px-1 py-1">
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          {tag}
          {!readOnly && (
            <button
              type="button"
              onClick={() => removeTag(index)}
              aria-label={`Remove ${tag}`}
              className="text-secondary-foreground/60 hover:text-secondary-foreground"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </span>
      ))}
      {!readOnly && (
        <input
          value={draftTag}
          onChange={(event) => setDraftTag(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              commitDraftTag();
            } else if (event.key === "Backspace" && draftTag === "" && tags.length > 0) {
              removeTag(tags.length - 1);
            }
          }}
          onBlur={commitDraftTag}
          placeholder={tags.length === 0 ? "Add…" : ""}
          className="h-6 min-w-16 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
        />
      )}
      {readOnly && tags.length === 0 && (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  );
}
