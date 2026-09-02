import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

/** Square checkbox with an inline label — used by filters and forms. */
export function Checkbox({ label, hint, className, id, ...props }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2.5 text-body-md text-on-surface",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className={cn(
          "mt-0.5 size-4 shrink-0 appearance-none rounded-xs border border-line-strong bg-card",
          "transition-colors duration-100 ease-fluent",
          "hover:border-accent-stroke",
          "checked:border-primary-container checked:bg-primary-container",
          // The tick is drawn with an inset shadow so the control stays native.
          "checked:shadow-[inset_0_0_0_2px_var(--colorNeutralForegroundOnBrand)]",
          "disabled:border-state-disabled-line disabled:bg-state-disabled-bg",
        )}
        {...props}
      />
      <span className="min-w-0">
        <span className="block leading-snug">{label}</span>
        {hint ? <span className="block text-label-sm text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}
