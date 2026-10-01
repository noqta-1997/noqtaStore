"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";

import { removeHandoutFromCart } from "@/app/actions/cart";
import { runAction } from "@/lib/action-result";
import { useToast } from "@/components/ui/toast";
import { notifyCartChanged } from "@/lib/cart-signal";

interface HandoutRemoveCartItemButtonProps {
  handoutId: string;
  label: string;
  successTitle: string;
  handoutTitle: string;
  failureMessage: string;
}

/**
 * Slides the row out, folds the gap it leaves, and gives the header's cart a
 * small shake, so the list closes up before the refresh drops the row rather
 * than jumping when it does.
 */
async function sendRowOff(row: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const away = getComputedStyle(row).direction === "rtl" ? -48 : 48;
  await row.animate(
    [
      { transform: "translateX(0)", opacity: 0.5 },
      { transform: `translateX(${away}px)`, opacity: 0 },
    ],
    { duration: 220, easing: "ease-in", fill: "forwards" },
  ).finished;

  const { height, paddingTop, paddingBottom } = getComputedStyle(row);
  row.style.overflow = "hidden";
  await row.animate(
    [
      { height, paddingTop, paddingBottom },
      { height: "0px", paddingTop: "0px", paddingBottom: "0px" },
    ],
    { duration: 240, easing: "ease-out", fill: "forwards" },
  ).finished;

  document
    .querySelector<HTMLElement>('header a[href="/cart"]')
    ?.animate(
      [
        { transform: "rotate(0)" },
        { transform: "rotate(-12deg)" },
        { transform: "rotate(10deg)" },
        { transform: "rotate(0)" },
      ],
      { duration: 360, easing: "ease-out" },
    );
}

/** `RemoveCartItemButton` over the handout cart table. */
export function HandoutRemoveCartItemButton({
  handoutId,
  label,
  successTitle,
  handoutTitle,
  failureMessage,
}: HandoutRemoveCartItemButtonProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async (event: MouseEvent<HTMLButtonElement>) => {
    const row = event.currentTarget.closest("li");
    setPending(true);
    // The row dims while the server answers; a refusal brings it back.
    const dim = row?.animate([{ opacity: 1 }, { opacity: 0.5 }], {
      duration: 150,
      fill: "forwards",
    });
    const result = await runAction(removeHandoutFromCart(handoutId));

    if (!result.ok) {
      setPending(false);
      dim?.cancel();
      toast({ title: failureMessage, tone: "error" });
      return;
    }

    if (row) await sendRowOff(row);
    toast({ title: successTitle, description: handoutTitle, tone: "info" });
    notifyCartChanged();
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-busy={pending || undefined}
      aria-label={label}
      title={label}
      className="inline-flex size-10 shrink-0 items-center justify-center border border-transparent text-on-surface transition-colors hover:border-error hover:bg-error-container hover:text-on-error-container disabled:opacity-50"
    >
      {pending ? (
        <LoaderCircle
          aria-hidden
          className="size-4 motion-safe:animate-spin"
          strokeWidth={1.75}
        />
      ) : (
        <Trash2 aria-hidden className="size-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
