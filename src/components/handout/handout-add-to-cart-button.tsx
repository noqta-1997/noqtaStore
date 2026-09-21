"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { addHandoutToCart } from "@/app/actions/cart";
import { runAction } from "@/lib/action-result";
import { Button, type ButtonSize } from "@/components/ui/button";
import { notifyCartChanged } from "@/lib/cart-signal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface HandoutAddToCartButtonProps {
  handoutId: string;
  label: string;
  toastTitle: string;
  toastNote?: string;
  /** Messages for the two outcomes the action can refuse with. */
  signInMessage: string;
  outOfStockMessage: string;
  failureMessage: string;
  disabled?: boolean;
  quantity?: number;
  size?: ButtonSize;
  iconOnly?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/** `AddToCartButton` writing a handout cart row; anonymous readers are sent to sign in. */
export function HandoutAddToCartButton({
  handoutId,
  label,
  toastTitle,
  toastNote,
  signInMessage,
  outOfStockMessage,
  failureMessage,
  disabled,
  quantity = 1,
  size = "md",
  iconOnly = false,
  fullWidth,
  className,
}: HandoutAddToCartButtonProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    const result = await runAction(addHandoutToCart(handoutId, quantity));
    setPending(false);

    if (result.ok) {
      toast({ title: toastTitle, description: toastNote });
      notifyCartChanged();
      router.refresh();
      return;
    }

    if (result.error === "unauthenticated") {
      toast({ title: signInMessage, tone: "info" });
      router.push(`/login?next=/cart`);
      return;
    }

    toast({
      title: result.error === "outOfStock" ? outOfStockMessage : failureMessage,
      tone: "error",
    });
  };

  return (
    <Button
      type="button"
      size={size}
      disabled={disabled || pending}
      fullWidth={fullWidth}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      onClick={onClick}
      className={cn(iconOnly && "px-0", className)}
    >
      <ShoppingBag aria-hidden className="size-4" strokeWidth={1.75} />
      {iconOnly ? null : label}
    </Button>
  );
}
