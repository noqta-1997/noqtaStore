import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface RadioCardProps extends InputHTMLAttributes<HTMLInputElement> {
  title: string;
  note?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}

/** A framed, selectable option row — shipping and payment choices. */
export function RadioCard({
  title,
  note,
  icon,
  trailing,
  className,
  id,
  disabled,
  ...props
}: RadioCardProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-3 border border-line bg-card p-4 transition-colors",
        "has-checked:bg-surface-high",
        disabled && "cursor-not-allowed opacity-55",
        className,
      )}
    >
      <input
        id={id}
        type="radio"
        disabled={disabled}
        className="size-4.5 shrink-0 appearance-none rounded-full border border-line bg-card checked:bg-primary-container checked:shadow-[inset_0_0_0_3px_var(--card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
        {...props}
      />
      {icon ? (
        <span className="flex size-10 shrink-0 items-center justify-center border border-line bg-surface-high text-primary">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-body-md font-semibold text-on-surface">{title}</span>
        {note ? <span className="block text-label-sm text-muted">{note}</span> : null}
      </span>
      {trailing}
    </label>
  );
}
