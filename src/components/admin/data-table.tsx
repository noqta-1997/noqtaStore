import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface TableProps {
  children: ReactNode;
  /** Minimum width before the table starts scrolling horizontally. */
  minWidth?: string;
  className?: string;
}

/** Bordered, horizontally scrollable data table shell. */
export function Table({ children, minWidth = "48rem", className }: TableProps) {
  return (
    <div className={cn("overflow-x-auto border border-line bg-card", className)}>
      <table className="w-full border-collapse text-start" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line bg-surface-high">{children}</thead>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-outline-variant">{children}</tbody>;
}

export function Tr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("transition-colors hover:bg-surface-low", className)}>
      {children}
    </tr>
  );
}

export function Th({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn("label-mono px-4 py-3 text-start text-muted", className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3 text-start align-middle text-sm", className)} {...props}>
      {children}
    </td>
  );
}
