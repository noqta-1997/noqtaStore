import type { ReactNode } from "react";

import { Surface, SurfaceHeader } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

interface PanelProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  /** Removes the body padding for tables that draw their own. */
  flush?: boolean;
  className?: string;
}

/**
 * The admin's basic building block, now a titled `Surface`.
 *
 * It kept its own copy of the frame and header markup; both moved into the
 * shared primitive, so a change to how a framed block looks happens in one
 * place rather than two.
 */
export function Panel({
  title,
  subtitle,
  action,
  children,
  flush = false,
  className,
}: PanelProps) {
  return (
    <Surface as="section" appearance="outline" className={cn("min-w-0", className)}>
      <SurfaceHeader title={title} subtitle={subtitle} action={action} />
      <div className={flush ? "" : "p-4"}>{children}</div>
    </Surface>
  );
}
