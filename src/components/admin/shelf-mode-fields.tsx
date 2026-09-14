"use client";

import { useRef, useState, type ReactNode } from "react";

import { RadioCard } from "@/components/ui/radio-card";
import type { ShelfMode } from "@/lib/home-sections";

interface ShelfModeFieldsProps {
  initial: ShelfMode;
  labels: {
    auto: string;
    /** What the shelf's rule shows — this shelf's, not a generic line. */
    autoNote: string;
    manual: string;
    manualNote: string;
  };
  /** The count field, shown while the rule is in charge. */
  auto: ReactNode;
  /** The picker, shown while the list is. */
  manual: ReactNode;
}

/**
 * The switch between a shelf's rule and a hand-picked list, showing only the
 * controls the chosen mode uses.
 *
 * The other mode's controls are hidden rather than unmounted, so their
 * fields still post: switching a shelf back to its rule keeps the list that
 * was picked, and switching to the list keeps the count, either to be used
 * again when the switch goes the other way.
 */
export function ShelfModeFields({ initial, labels, auto, manual }: ShelfModeFieldsProps) {
  const [mode, setMode] = useState<ShelfMode>(initial);
  const autoPane = useRef<HTMLDivElement>(null);

  const chooseManual = () => {
    /* A count typed out of range would keep the form from submitting while
       its field is hidden, with nothing on screen to explain why. The rule
       is not in charge in this mode, so the field goes back to what it had. */
    autoPane.current?.querySelectorAll("input:invalid").forEach((field) => {
      if (field instanceof HTMLInputElement) field.value = field.defaultValue;
    });
    setMode("manual");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <RadioCard
          id="shelf-mode-auto"
          name="mode"
          value="auto"
          checked={mode === "auto"}
          onChange={() => setMode("auto")}
          title={labels.auto}
          note={labels.autoNote}
        />
        <RadioCard
          id="shelf-mode-manual"
          name="mode"
          value="manual"
          checked={mode === "manual"}
          onChange={chooseManual}
          title={labels.manual}
          note={labels.manualNote}
        />
      </div>

      <div ref={autoPane} hidden={mode !== "auto"}>
        {auto}
      </div>
      <div hidden={mode !== "manual"}>{manual}</div>
    </div>
  );
}
