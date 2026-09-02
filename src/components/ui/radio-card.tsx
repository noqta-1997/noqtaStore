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
        "flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-card p-4",
        "transition-colors duration-100 ease-fluent hover:bg-card-hover",
        "has-checked:border-accent-stroke has-checked:bg-state-selected",
        disabled && "cursor-not-allowed opacity-55",
        className,
      )}
    >
      <input
        id={id}
        type="radio"
        disabled={disabled}
        className={cn(
          "size-4 shrink-0 appearance-none rounded-full border border-line-strong bg-card",
          "transition-colors duration-100 ease-fluent hover:border-accent-stroke",
          "checked:border-primary-container",
          "checked:shadow-[inset_0_0_0_3px_var(--colorNeutralBackground1),inset_0_0_0_9px_var(--colorBrandBackground)]",
          "disabled:border-state-disabled-line disabled:bg-state-disabled-bg",
        )}
        {...props}
      />
      {icon ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
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
