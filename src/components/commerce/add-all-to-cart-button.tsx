"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { addWishlistToCart } from "@/app/actions/cart";
import { Button } from "@/components/ui/button";
import { notifyCartChanged } from "@/lib/cart-signal";
import { useToast } from "@/components/ui/toast";

interface AddAllToCartButtonProps {
  label: string;
  successTitle: string;
  failureMessage: string;
}

/** Moves the whole wishlist into the cart in one write. */
export function AddAllToCartButton({
  label,
  successTitle,
  failureMessage,
}: AddAllToCartButtonProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    const result = await addWishlistToCart();
    setPending(false);

    if (!result.ok) {
      toast({ title: failureMessage, tone: "error" });
      return;
    }

    toast({ title: successTitle });
    notifyCartChanged();
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      disabled={pending}
    >
      <ShoppingBag aria-hidden className="size-4" strokeWidth={1.75} />
      {label}
    </Button>
  );
}
