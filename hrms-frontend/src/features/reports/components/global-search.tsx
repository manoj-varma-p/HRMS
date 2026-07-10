"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Building2, Briefcase, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import * as searchService from "@/services/search.service";

interface FlatResult {
  key: string;
  icon: typeof Users;
  label: string;
  sublabel?: string;
  path: string;
}

export function GlobalSearch() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const debouncedQuery = useDebouncedValue(query);

  const isAdmin = Boolean(user) && (user!.role === ROLES.ADMIN || user!.role === ROLES.SUPER_ADMIN);
  const trimmed = debouncedQuery.trim();

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", trimmed],
    queryFn: () => searchService.globalSearch(trimmed).then((res) => res.data),
    enabled: isAdmin && trimmed.length >= 2,
  });

  if (!isAdmin) {
    return null;
  }

  const results: FlatResult[] = data
    ? [
        ...data.employees.map((e) => ({
          key: `employee-${e.id}`,
          icon: Users,
          label: e.fullName,
          sublabel: `${e.employeeId} · ${e.email}`,
          path: ROUTES.EMPLOYEE_DETAIL(e.id),
        })),
        ...data.departments.map((d) => ({
          key: `department-${d.id}`,
          icon: Building2,
          label: d.name,
          path: ROUTES.ADMINISTRATION_DEPARTMENTS,
        })),
        ...data.designations.map((d) => ({
          key: `designation-${d.id}`,
          icon: Briefcase,
          label: d.name,
          path: ROUTES.ADMINISTRATION_DESIGNATIONS,
        })),
      ]
    : [];

  function go(path: string) {
    setOpen(false);
    setQuery("");
    setHighlightIndex(-1);
    router.push(path);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[highlightIndex] ?? results[0];
      if (target) go(target.path);
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlightIndex(-1);
    }
  }

  return (
    <div className="relative hidden w-full max-w-sm sm:block">
      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search employees, departments..."
        className="pl-8"
        value={query}
        role="combobox"
        aria-expanded={open}
        aria-controls="global-search-results"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlightIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
      />
      {open && trimmed.length >= 2 && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {isFetching && (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}
          {!isFetching && results.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">No matches found.</p>
          )}
          {!isFetching &&
            results.map((result, index) => (
              <button
                key={result.key}
                type="button"
                role="option"
                aria-selected={index === highlightIndex}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  index === highlightIndex ? "bg-accent" : "hover:bg-accent"
                }`}
                onMouseEnter={() => setHighlightIndex(index)}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => go(result.path)}
              >
                <result.icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex flex-col">
                  <span>{result.label}</span>
                  {result.sublabel && <span className="text-xs text-muted-foreground">{result.sublabel}</span>}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
