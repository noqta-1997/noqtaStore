"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  defaultValue?: number;
  min?: number;
  max?: number;
  labels: { quantity: string; increase: string; decrease: string };
  /** Told the new value at once, for a local stepper feeding another control. */
  onChange?: (value: number) => void;
  className?: string;
}

export function QuantityStepper({
  defaultValue = 1,
  min = 1,
  max = 99,
  labels,
  onChange,
  className,
}: QuantityStepperProps) {
  const [value, setValue] = useState(defaultValue);

  const change = (next: number) => {
    setValue(next);
    onChange?.(next);
  };

  const button =
    "inline-flex size-9 items-center justify-center text-on-surface transition-colors hover:bg-state-hover disabled:text-muted disabled:hover:bg-transparent";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-line bg-card",
        className,
      )}
    >
      <button
        type="button"
        aria-label={labels.decrease}
        disabled={value <= min}
        onClick={() => change(Math.max(min, value - 1))}
        className={button}
      >
        <Minus aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        readOnly
        aria-label={labels.quantity}
        value={value}
        data-numeric
        className="w-10 border-x border-line bg-transparent py-2 text-center text-sm font-semibold text-on-surface focus:outline-none"
      />
      <button
        type="button"
        aria-label={labels.increase}
        disabled={value >= max}
        onClick={() => change(Math.min(max, value + 1))}
        className={button}
      >
        <Plus aria-hidden className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
