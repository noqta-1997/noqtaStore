import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "h-11 w-full border border-line bg-card px-4 text-base text-on-surface",
        "placeholder:text-muted",
        "aria-invalid:border-error aria-invalid:bg-error-container/30",
        "focus:shadow-hard-sm focus:outline-none focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:border-outline disabled:text-muted",
        className,
      )}
      {...props}
    />
  );
}
