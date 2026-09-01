import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 border border-line bg-card px-6 py-16 text-center",
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center border border-line bg-surface-high">
        <Icon aria-hidden className="size-6 text-primary" strokeWidth={2} />
      </span>
      <div className="space-y-1">
        <h2 className="text-headline-md">{title}</h2>
        <p className="mx-auto max-w-sm text-body-md text-muted">{description}</p>
      </div>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={buttonStyles({ size: "md" })}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
