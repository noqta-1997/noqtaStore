"use client";

import { useEffect, useRef } from "react";

/** Anything Fluent renders as a floating layer. */
const FLOATING = '[role="dialog"], [role="menu"], [role="listbox"], [role="tooltip"]';

/**
 * Returns focus to whatever had it before an overlay opened.
 *
 * Fluent restores focus itself when the overlay is opened through a
 * `DialogTrigger`. The dialog and drawer here are controlled by an `open` prop
 * with their triggers outside the overlay, so Fluent has nothing to hand focus
 * back to — it lands on `<body>`, which drops a keyboard user at the top of
 * the page.
 *
 * The trigger cannot be captured in an effect keyed on `open`: child effects
 * run before parent ones, so by the time such an effect ran, Fluent had
 * already moved focus into the overlay and the element captured was one about
 * to unmount. Ignoring focus that lands inside a floating layer sidesteps the
 * ordering question entirely — the last element recorded is always the trigger.
 */
export function useRestoreFocus(open: boolean) {
  const lastFocused = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target === document.body) return;
      if (target.closest(FLOATING)) return;
      lastFocused.current = target;
    };

    document.addEventListener("focusin", onFocusIn, true);
    return () => document.removeEventListener("focusin", onFocusIn, true);
  }, []);

  useEffect(() => {
    const opened = wasOpen.current;
    wasOpen.current = open;

    if (open || !opened) return;

    const target = lastFocused.current;
    if (!target?.isConnected) return;

    /*
     * Fluent's focus management keeps running while the overlay animates out
     * and will move focus to <body> after we put it back. Retrying across a
     * few frames lets ours be the one that lands, and it stops once it sticks.
     */
    let attempts = 0;
    let raf = 0;

    const restore = () => {
      if (!target.isConnected || document.activeElement === target) return;
      target.focus();
      if (attempts < 30) {
        attempts += 1;
        raf = window.requestAnimationFrame(restore);
      }
    };

    raf = window.requestAnimationFrame(restore);
    return () => window.cancelAnimationFrame(raf);
  }, [open]);
}
