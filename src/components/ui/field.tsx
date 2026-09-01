import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  optional?: string;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint/error, so every form reads the same. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-baseline gap-2 text-label-md text-on-surface"
      >
        {label}
        {optional ? (
          <span className="text-label-sm text-muted">({optional})</span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-label-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="text-label-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
