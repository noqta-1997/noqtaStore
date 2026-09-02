"use client";

import { Download, Printer } from "lucide-react";

import { buttonStyles, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

interface PrintButtonProps {
  label: string;
  /** `download` only changes the icon — both open the browser's print dialog, which is where "save as PDF" lives. */
  icon?: "print" | "download";
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

/**
 * Prints the current page. The invoice layout is handled by the print styles
 * in globals.css, which drop the chrome and keep the order itself.
 */
export function PrintButton({
  label,
  icon = "print",
  variant = "secondary",
  size = "md",
  fullWidth,
}: PrintButtonProps) {
  const Icon = icon === "download" ? Download : Printer;

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={buttonStyles({ variant, size, fullWidth })}
    >
      <Icon aria-hidden className="size-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}
