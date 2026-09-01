import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "w-full border border-line bg-card px-4 py-3 text-base text-on-surface",
        "placeholder:text-muted focus:shadow-hard-sm focus:outline-none",
        "aria-invalid:border-error aria-invalid:bg-error-container/30",
        "disabled:cursor-not-allowed disabled:border-outline disabled:text-muted",
        className,
      )}
      {...props}
    />
  );
}
