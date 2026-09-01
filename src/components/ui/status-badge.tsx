import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const tones: Record<OrderStatus, string> = {
  pending: "border-line bg-surface-high text-on-surface",
  processing: "border-line bg-primary-fixed text-on-primary-container",
  shipped: "border-line bg-primary-container text-on-primary-container",
  delivered: "border-line bg-success text-white",
  cancelled: "border-line bg-error-container text-on-error-container",
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
        "label-mono inline-flex items-center border px-2 py-1",
        tones[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
