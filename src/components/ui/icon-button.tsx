import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type IconButtonVariant = "outline" | "ghost" | "solid";

const variants: Record<IconButtonVariant, string> = {
  outline:
    "border border-line bg-card text-on-surface hover:bg-primary-container hover:text-on-primary-container",
  ghost:
    "border border-transparent text-on-surface hover:border-line hover:bg-surface-high",
  solid:
    "border border-line bg-primary-container text-on-primary-container hover:-translate-y-0.5 hover:shadow-hard-sm",
};

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  /** Always required — icon-only controls need an accessible name. */
  label: string;
}

export function IconButton({
  variant = "ghost",
  label,
  className,
  type = "button",
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center transition-all duration-150",
        "disabled:pointer-events-none disabled:border-outline disabled:text-muted",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
