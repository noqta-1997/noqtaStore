import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

import { fieldStyles } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/**
 * A native `<select>` with Fluent's field frame.
 *
 * Deliberately not Fluent's `Select` or `Combobox`: eight of the nine call
 * sites are Server Components, and switching would force `"use client"` on
 * every form that submits through a Server Action.
 */
export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(fieldStyles, "h-8 appearance-none pe-8 text-body-md", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
        strokeWidth={2}
      />
    </div>
  );
}
