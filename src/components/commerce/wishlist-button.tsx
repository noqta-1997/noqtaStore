"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { toggleWishlist } from "@/app/actions/cart";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { setWishlistSaved, useWishlistIds } from "@/lib/wishlist-store";

interface WishlistButtonProps {
  bookId: string;
  label: string;
  addedTitle: string;
  removedTitle: string;
  signInMessage: string;
  bookTitle: string;
  /** What to show until the reader's saved books are known. */
  defaultSaved?: boolean;
  className?: string;
}

export function WishlistButton({
  bookId,
  label,
  addedTitle,
  removedTitle,
  signInMessage,
  bookTitle,
  defaultSaved = false,
  className,
}: WishlistButtonProps) {
  const savedIds = useWishlistIds();
  const [pending, setPending] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const saved = savedIds ? savedIds.has(bookId) : defaultSaved;

  const onClick = async () => {
    // Flip first so the heart answers the click immediately; the store is the
    // one source every heart for this book reads.
    const optimistic = !saved;
    setWishlistSaved(bookId, optimistic);
    setPending(true);

    const result = await toggleWishlist(bookId);
    setPending(false);

    if (!result.ok) {
      setWishlistSaved(bookId, !optimistic);

      if (result.error === "unauthenticated") {
        toast({ title: signInMessage, tone: "info" });
        router.push(`/login?next=/account/wishlist`);
      }
      return;
    }

    const added = result.message === "added";
    setWishlistSaved(bookId, added);
    toast({
      title: added ? addedTitle : removedTitle,
      description: bookTitle,
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
