"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { removeHandoutFromCart } from "@/app/actions/cart";
import { useToast } from "@/components/ui/toast";
import { notifyCartChanged } from "@/lib/cart-signal";

interface HandoutRemoveCartItemButtonProps {
  handoutId: string;
  label: string;
  successTitle: string;
  handoutTitle: string;
  failureMessage: string;
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

  const onClick = async () => {
    setPending(true);
    const result = await removeHandoutFromCart(handoutId);
    setPending(false);

    if (!result.ok) {
      toast({ title: failureMessage, tone: "error" });
      return;
    }

    toast({ title: successTitle, description: handoutTitle, tone: "info" });
    notifyCartChanged();
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={label}
      title={label}
      className="inline-flex size-10 shrink-0 items-center justify-center border border-transparent text-on-surface transition-colors hover:border-error hover:bg-error-container hover:text-on-error-container disabled:opacity-50"
    >
      <Trash2 aria-hidden className="size-4" strokeWidth={1.75} />
    </button>
  );
}
