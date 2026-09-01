import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold " +
  "transition-all duration-150 select-none " +
  "disabled:pointer-events-none disabled:border-outline disabled:bg-transparent " +
  "disabled:text-muted";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-line bg-primary-container text-on-primary-container " +
    "hover:-translate-y-0.5 hover:shadow-hard active:translate-y-0 active:shadow-hard-none",
  secondary:
    "border border-line bg-transparent text-on-surface hover:bg-surface-high " +
    "hover:-translate-y-0.5 hover:shadow-hard active:translate-y-0 active:shadow-hard-none",
  ghost:
    "border border-transparent font-mono font-medium tracking-[0.05em] text-on-surface " +
    "underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** Shared styles so links can look exactly like buttons without extra deps. */
export function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<ButtonStyleOptions, "className"> {}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
