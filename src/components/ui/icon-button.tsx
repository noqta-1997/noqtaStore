import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type IconButtonVariant = "outline" | "subtle" | "solid";
export type IconButtonSize = "sm" | "md" | "lg";

const variants: Record<IconButtonVariant, string> = {
  outline:
    "border-line bg-card text-on-surface " +
    "hover:border-line-hover hover:bg-card-hover " +
    "active:border-line-pressed active:bg-card-pressed",
  subtle:
    "border-transparent bg-transparent text-on-surface-variant " +
    "hover:bg-state-hover hover:text-on-surface active:bg-state-pressed",
  solid:
    "border-transparent bg-primary-container text-on-primary-container " +
    "hover:bg-primary-container-hover active:bg-primary-container-pressed",
};

/** Square counterparts of the Button ramp. */
const sizes: Record<IconButtonSize, string> = {
  sm: "size-6",
  md: "size-8",
  lg: "size-10",
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Always required — icon-only controls need an accessible name. */
  label: string;
}

export function IconButton({
  variant = "subtle",
  size = "lg",
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
        "inline-flex shrink-0 items-center justify-center rounded-md border",
        "transition-colors duration-100 ease-fluent",
        "disabled:pointer-events-none disabled:border-state-disabled-line",
        "disabled:bg-state-disabled-bg disabled:text-state-disabled-fg",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
