"use client";

import { Check, LoaderCircle, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";

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

/**
 * Throws a bag from the button up to the header's cart and nudges the cart
 * when it lands. Two nested layers so the sideways and the upward legs can
 * ease differently, which is what bends the path into an arc.
 */
function flyToCart(from: HTMLElement) {
  const cart = document.querySelector<HTMLElement>('header a[href="/cart"]');
  if (!cart || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const start = from.getBoundingClientRect();
  const end = cart.getBoundingClientRect();
  const size = 36;
  const dx = end.left + end.width / 2 - (start.left + start.width / 2);
  const dy = end.top + end.height / 2 - (start.top + start.height / 2);

  const track = document.createElement("div");
  track.setAttribute("aria-hidden", "true");
  track.className = "pointer-events-none fixed z-50";
  Object.assign(track.style, {
    left: `${start.left + start.width / 2 - size / 2}px`,
    top: `${start.top + start.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
  });

  const token = document.createElement("div");
  token.className =
    "flex size-full items-center justify-center rounded-full bg-primary-container text-on-primary-container elevation-md";
  const icon = cart.querySelector("svg")?.cloneNode(true);
  if (icon) token.append(icon);
  track.append(token);
  document.body.append(track);

  const duration = 700;
  track.animate([{ transform: "translateX(0)" }, { transform: `translateX(${dx}px)` }], {
    duration,
    easing: "linear",
    fill: "forwards",
  });
  const flight = token.animate(
    [
      { transform: "translateY(0) scale(1)", opacity: 1 },
      { transform: `translateY(${dy}px) scale(0.45)`, opacity: 0.7 },
    ],
    { duration, easing: "cubic-bezier(0.2, 0.7, 0.4, 1)", fill: "forwards" },
  );

  flight.onfinish = () => {
    track.remove();
    cart.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }],
      { duration: 320, easing: "ease-out" },
    );
  };
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
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const onClick = async (event: MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    setPending(true);
    setAdded(false);
    const result = await runAction(addHandoutToCart(handoutId, quantity));
    setPending(false);

    if (result.ok) {
      // A tick in place of the bag for a moment, so the press visibly landed.
      setAdded(true);
      clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setAdded(false), 1600);
      flyToCart(button);
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
      aria-busy={pending || undefined}
      fullWidth={fullWidth}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      onClick={onClick}
      className={cn(iconOnly && "px-0", className)}
    >
      {pending ? (
        <LoaderCircle
          aria-hidden
          className="size-4 motion-safe:animate-spin"
          strokeWidth={1.75}
        />
      ) : added ? (
        <Check
          aria-hidden
          className="size-4 motion-safe:animate-[bounce_0.6s_1.5]"
          strokeWidth={2.25}
        />
      ) : (
        <ShoppingBag aria-hidden className="size-4" strokeWidth={1.75} />
      )}
      {iconOnly ? null : label}
    </Button>
  );
}
