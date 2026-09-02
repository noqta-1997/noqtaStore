import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

/**
 * Fluent expresses status with a tinted background and a matching foreground
 * from the same palette, rather than a saturated fill under white.
 */
const tones: Record<OrderStatus, string> = {
  pending: "bg-surface-low text-on-surface-variant",
  processing: "bg-primary-fixed text-on-primary-fixed",
  shipped: "bg-primary-container text-on-primary-container",
  delivered: "bg-success text-on-success",
  cancelled: "bg-error-container text-on-error-container",
};

interface StatusBadgeProps {
  status: OrderStatus;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-sm px-1.5 text-label-md font-semibold",
        tones[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
