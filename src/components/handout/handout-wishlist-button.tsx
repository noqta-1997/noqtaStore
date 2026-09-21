"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { toggleHandoutWishlist } from "@/app/actions/cart";
import { runAction } from "@/lib/action-result";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { setWishlistSaved, useWishlistIds } from "@/lib/wishlist-store";

interface HandoutWishlistButtonProps {
  handoutId: string;
  label: string;
  addedTitle: string;
  removedTitle: string;
  signInMessage: string;
  handoutTitle: string;
  /** What to show until the reader's saved items are known. */
  defaultSaved?: boolean;
  className?: string;
}

/**
 * `WishlistButton` for a handout. It reads the same store as the book hearts:
 * `/api/wishlist/ids` lists both kinds of saved id, and the ids never collide.
 */
export function HandoutWishlistButton({
  handoutId,
  label,
  addedTitle,
  removedTitle,
  signInMessage,
  handoutTitle,
  defaultSaved = false,
  className,
}: HandoutWishlistButtonProps) {
  const savedIds = useWishlistIds();
  const [pending, setPending] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const saved = savedIds ? savedIds.has(handoutId) : defaultSaved;

  const onClick = async () => {
    // Flip first so the heart answers the click immediately; the store is the
    // one source every heart for this handout reads.
    const optimistic = !saved;
    setWishlistSaved(handoutId, optimistic);
    setPending(true);

    const result = await runAction(toggleHandoutWishlist(handoutId));
    setPending(false);

    if (!result.ok) {
      setWishlistSaved(handoutId, !optimistic);

      if (result.error === "unauthenticated") {
        toast({ title: signInMessage, tone: "info" });
        router.push(`/login?next=/account/wishlist`);
      }
      return;
    }

    const added = result.message === "added";
    setWishlistSaved(handoutId, added);
    toast({
      title: added ? addedTitle : removedTitle,
      description: handoutTitle,
      tone: added ? "success" : "info",
    });
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={label}
      aria-pressed={saved}
      title={label}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-card",
        "text-on-surface transition-colors hover:bg-primary-container hover:text-on-primary-container",
        saved && "bg-primary-container text-on-primary-container",
        className,
      )}
    >
      <Heart aria-hidden className={cn("size-4", saved && "fill-current")} strokeWidth={1.75} />
    </button>
  );
}
