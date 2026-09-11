import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

/**
 * Fluent expresses status with a tinted background and a matching foreground
 * from the same palette. `delivered` is the deliberate exception: it keeps a
 * saturated fill under white so a completed order is picked out from the four
 * tinted states at a glance.
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
  /**
   * Stretch to the width of the container instead of hugging the label. For
   * the status column of a table, where the colour reads as the column rather
   * than as a chip floating inside it.
   */
  fill?: boolean;
  className?: string;
}

/**
 * Square corners, not a pill.
 *
 * This was `rounded-full` at 22px tall, which wrapped the label in a tight
 * capsule — against flat surfaces and hairline borders the curve read as loose
 * rather than deliberate, and in a table it left a rounded blob adrift in the
 * middle of a square cell. Straight edges sit with the rest of the design, and
 * `fill` lets the colour own its cell instead of floating in it.
 */
export function StatusBadge({
  status,
  label,
  fill = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "h-7 items-center px-2.5 text-label-md font-semibold",
        fill ? "flex w-full justify-center" : "inline-flex",
        tones[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
