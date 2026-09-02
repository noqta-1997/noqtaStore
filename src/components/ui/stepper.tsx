import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  /** Zero-based index of the step in progress. */
  current: number;
  className?: string;
}

/** Numbered progress indicator for multi-step flows. */
export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-2 sm:gap-4", className)}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <li key={step} className="flex items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-label-md font-semibold",
                  done && "bg-success text-on-success",
                  active && "bg-primary-container text-on-primary-container",
                  !done && !active && "bg-card text-muted",
                )}
                data-numeric
              >
                {done ? (
                  <Check aria-hidden className="size-4" strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  "text-label-md",
                  active ? "font-semibold text-on-surface" : "text-muted",
                )}
              >
                {step}
              </span>
            </span>

            {index < steps.length - 1 ? (
              <span aria-hidden className="hidden h-px w-8 bg-outline sm:block" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
