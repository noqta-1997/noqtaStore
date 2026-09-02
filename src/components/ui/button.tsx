import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/** Fluent's five appearances. */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "subtle"
  | "transparent";

export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold " +
  "border transition-[background-color,border-color,box-shadow] duration-100 ease-fluent select-none " +
  "disabled:pointer-events-none disabled:border-state-disabled-line " +
  "disabled:bg-state-disabled-bg disabled:text-state-disabled-fg disabled:shadow-none";

const variants: Record<ButtonVariant, string> = {
  /* The reference lifts its one warm action off the page; every other
     appearance stays flat, so the lift reads as "this is the action". */
  primary:
    "border-transparent bg-primary-container text-on-primary-container elevation-sm " +
    "hover:bg-primary-container-hover hover:elevation-md " +
    "active:bg-primary-container-pressed active:elevation-none",
  // Fluent's default: a neutral surface with a visible stroke.
  secondary:
    "border-line bg-card text-on-surface " +
    "hover:border-line-hover hover:bg-card-hover " +
    "active:border-line-pressed active:bg-card-pressed",
  outline:
    "border-line bg-transparent text-on-surface " +
    "hover:border-line-hover hover:bg-state-hover active:bg-state-pressed",
  subtle:
    "border-transparent bg-transparent text-on-surface-variant " +
    "hover:bg-state-hover hover:text-on-surface active:bg-state-pressed",
  transparent:
    "border-transparent bg-transparent text-on-surface-variant " +
    "hover:text-primary active:text-primary",
};

/**
 * Fluent's 24 / 32 / 40 height ramp is unchanged — the fields are cut to the
 * same three heights and they have to keep lining up. What grew is the
 * horizontal padding, which is where the reference's roomier buttons actually
 * come from. Anything that wants the reference's tall hero action asks for it
 * at the call site.
 */
const sizes: Record<ButtonSize, string> = {
  sm: "h-6 px-3 text-label-md",
  md: "h-8 px-4 text-body-md",
  lg: "h-10 px-6 text-body-lg",
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
