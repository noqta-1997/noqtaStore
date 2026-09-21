"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { reorder } from "@/app/actions/cart";
import { runAction } from "@/lib/action-result";
import { buttonStyles } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { notifyCartChanged } from "@/lib/cart-signal";

interface ReorderButtonProps {
  orderId: string;
  label: string;
  successTitle: string;
  signInMessage: string;
  errorMessages: Record<string, string>;
  fallbackError: string;
}

/** Refills the cart from a past order and sends the reader straight to it. */
export function ReorderButton({
  orderId,
  label,
  successTitle,
  signInMessage,
  errorMessages,
  fallbackError,
}: ReorderButtonProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    const result = await runAction(reorder(orderId));
    setPending(false);

    if (!result.ok) {
      if (result.error === "unauthenticated") {
        toast({ title: signInMessage, tone: "info" });
        router.push(`/login?next=/account/orders`);
        return;
      }

      toast({
        title: errorMessages[result.error] ?? fallbackError,
        tone: "error",
      });
      return;
    }

    notifyCartChanged();
    toast({ title: successTitle, tone: "success" });
    router.push(`/cart`);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={buttonStyles({ variant: "secondary", size: "sm" })}
    >
      <RotateCcw aria-hidden className="size-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}
