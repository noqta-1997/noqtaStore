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
        className="mt-0.5 size-4.5 shrink-0 appearance-none border border-line bg-card checked:bg-primary-container checked:shadow-[inset_0_0_0_3px_var(--card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
        {...props}
      />
      <span className="min-w-0">
        <span className="block leading-snug">{label}</span>
        {hint ? <span className="block text-label-sm text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}
