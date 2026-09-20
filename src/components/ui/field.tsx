import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor: string;
  /** Usually a sentence; a node when part of it is a link. */
  hint?: ReactNode;
  error?: string;
  optional?: string;
  /** Renders Fluent's required marker after the label. */
  required?: boolean;
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
  required = false,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-baseline gap-1 text-body-md font-semibold text-on-surface"
      >
        {label}
        {required ? (
          <span aria-hidden className="text-error">
            *
          </span>
        ) : null}
        {optional ? (
          <span className="font-normal text-label-md text-muted">({optional})</span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-label-md text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="text-label-md text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
