import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Native select with the project's frame and a custom chevron. */
export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-11 w-full appearance-none border border-line bg-card ps-4 pe-10 text-base text-on-surface",
          "focus:shadow-hard-sm focus:outline-none",
          "aria-invalid:border-error aria-invalid:bg-error-container/30",
          "disabled:cursor-not-allowed disabled:border-outline disabled:text-muted",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-on-surface"
        strokeWidth={2}
      />
    </div>
  );
}
