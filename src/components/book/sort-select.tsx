"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";

export interface SortOption {
  value: string;
  label: string;
}

interface SortSelectProps {
  value: string;
  label: string;
  options: SortOption[];
}

/** Changing the sort rewrites the URL, so results stay shareable. */
export function SortSelect({ value, label, options }: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", next);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <label className="flex items-center gap-2">
      <span className="label-mono shrink-0 text-muted">{label}</span>
      <Select
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-44"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}
