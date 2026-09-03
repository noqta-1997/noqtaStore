import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A framed content block, in Fluent's Card appearances.
 *
 * This is deliberately not called `Card`. Classifying all 89 `bg-card` call
 * sites showed only five were interactive entity cards; twenty-three were
 * plain framed containers, and thirty-nine were not cards at all — form
 * controls, buttons, chrome. `Surface` covers the twenty-three honestly.
 */
export type SurfaceAppearance = "filled" | "filled-alternative" | "outline" | "subtle";
export type SurfacePadding = "none" | "sm" | "md" | "lg";

const appearances: Record<SurfaceAppearance, string> = {
  filled: "border-transparent bg-card elevation-sm",
  "filled-alternative": "border-line bg-surface-low",
  outline: "border-line bg-card",
  subtle: "border-transparent bg-transparent",
};

const paddings: Record<SurfacePadding, string> = {
  none: "",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

interface SurfaceProps {
  as?: ElementType;
  appearance?: SurfaceAppearance;
  padding?: SurfacePadding;
  /** Adds Fluent's interactive treatment: raised on hover, focusable. */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}

export function Surface({
  as: Tag = "div",
  appearance = "outline",
  padding = "none",
  interactive = false,
  className,
  children,
}: SurfaceProps) {
  return (
    <Tag
      className={cn(
        "min-w-0 rounded-xl border",
        appearances[appearance],
        paddings[padding],
        interactive &&
          "transition-shadow duration-100 ease-fluent " +
            "hover:elevation-md focus-within:elevation-md",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

interface SurfaceHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

/** Titled header bar, matching Fluent's CardHeader proportions. */
export function SurfaceHeader({
  title,
  subtitle,
  action,
  className,
}: SurfaceHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-line-divider px-4 py-3",
        className,
      )}
    >
      <div className="space-y-0.5">
        <h2 className="text-body-lg font-semibold text-on-surface">{title}</h2>
        {subtitle ? <p className="text-label-md text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/**
 * The storefront panel title — a heading that draws the panel's own first
 * divider.
 *
 * `SurfaceHeader` is the admin's header bar: denser, and built to carry a
 * subtitle and an action alongside the title. The storefront panels are
 * roomier and carry nothing but the heading, and eight of them had written
 * the same string by hand. Exported as styles rather than as a component
 * because the call sites choose their own heading level — a page's own panels
 * are `h2`, a panel nested under one is `h3`.
 */
export function surfaceTitleStyles(className?: string) {
  return cn("border-b border-line px-5 py-4 text-headline-md", className);
}
