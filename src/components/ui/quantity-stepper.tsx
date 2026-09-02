"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { setCartQuantity } from "@/app/actions/cart";
import { notifyCartChanged } from "@/lib/cart-signal";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  defaultValue?: number;
  min?: number;
  max?: number;
  labels: { quantity: string; increase: string; decrease: string };
  /** When set, changes are written to that cart line instead of staying local. */
  bookId?: string;
  className?: string;
}

/** Debounced so holding the button does not fire a write per click. */
const WRITE_DELAY = 500;

export function QuantityStepper({
  defaultValue = 1,
  min = 1,
  max = 99,
  labels,
  bookId,
  className,
}: QuantityStepperProps) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committed = useRef(defaultValue);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const change = (next: number) => {
    setValue(next);
    if (!bookId) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (next === committed.current) return;
      committed.current = next;
      await setCartQuantity(bookId, next);
      notifyCartChanged();
      router.refresh();
    }, WRITE_DELAY);
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
