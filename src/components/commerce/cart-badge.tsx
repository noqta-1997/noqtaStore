"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { subscribeToCartChanges } from "@/lib/cart-signal";

/**
 * Reads the count from the browser so the pages that render the header can
 * stay static. It shows nothing until the first answer arrives — a badge with
 * a wrong number is worse than no badge.
 */
export function CartBadge() {
  const [count, setCount] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/cart/count", { cache: "no-store" });
        if (!response.ok) return;

        const data: { count?: number } = await response.json();
        if (!cancelled) setCount(data.count ?? 0);
      } catch {
        /* offline or navigating away — leave the last known count */
      }
    };

    void load();
    const unsubscribe = subscribeToCartChanges(load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [pathname]);

  if (!count) return null;

  return (
    <span
      className="absolute -end-2 -top-2 flex size-5 items-center justify-center border border-line bg-primary-container font-mono text-[0.625rem] font-semibold text-on-primary-container"
      data-numeric
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
