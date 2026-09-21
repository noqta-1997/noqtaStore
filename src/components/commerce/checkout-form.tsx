"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { placeOrder } from "@/app/actions/checkout";
import { CHECKOUT_FORM_ID, useCheckoutState } from "@/components/commerce/checkout-state";
import { useToast } from "@/components/ui/toast";
import { runAction } from "@/lib/action-result";

interface CheckoutFormProps {
  messages: {
    placed: string;
    emptyCart: string;
    missingAddress: string;
    stockChanged: string;
    /** Keyed by the coupon error the action can return. */
    coupon: Record<"unknownCoupon" | "expiredCoupon" | "couponMinimum", string>;
    signIn: string;
    blocked: string;
    failure: string;
  };
  className?: string;
  children: ReactNode;
}

function isCouponError(
  error: string,
): error is "unknownCoupon" | "expiredCoupon" | "couponMinimum" {
  return error === "unknownCoupon" || error === "expiredCoupon" || error === "couponMinimum";
}

/**
 * The submit button lives in the summary sidebar, outside this element, and
 * reaches it through `form="checkout-form"`. Both read `pending` from
 * `CheckoutProvider`: the button to disable itself, this form to refuse a
 * submit that arrives while the first is still being written.
 */
export function CheckoutForm({
  messages,
  className,
  children,
}: CheckoutFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { pending, setPending } = useCheckoutState();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Two submits in flight would be two orders: `placeOrder` empties the
    // cart, but only once the first transaction commits, and the second can
    // read the cart before that.
    if (pending) return;
    setError(null);
    setPending(true);

    const result = await runAction(placeOrder(new FormData(event.currentTarget)));

    if (result.ok) {
      // Stays pending: the page is being left, and the button must not come
      // back for a click between the toast and the confirmation page.
      toast({ title: messages.placed, description: result.message });
      router.push(`/checkout/success?order=${result.message}`);
      router.refresh();
      return;
    }

    setPending(false);

    const text =
      result.error === "emptyCart"
        ? messages.emptyCart
        : result.error === "missingAddress"
          ? messages.missingAddress
          : result.error === "outOfStock"
            ? messages.stockChanged
            : result.error === "blocked"
              ? messages.blocked
              : result.error === "unauthenticated"
                ? messages.signIn
                : isCouponError(result.error)
                  ? messages.coupon[result.error]
                  : messages.failure;

    setError(text);
    toast({ title: text, tone: "error" });

    if (result.error === "unauthenticated") {
      router.push(`/login?next=/checkout`);
    }

    // The action dropped the code; the summary must stop showing its discount.
    if (isCouponError(result.error)) router.refresh();
    // The cart changed under the page — a line sold out, or it was emptied
    // in another tab. Draw it as it is now.
    if (result.error === "outOfStock" || result.error === "emptyCart") router.refresh();
  };

  return (
    <form id={CHECKOUT_FORM_ID} className={className} onSubmit={onSubmit} aria-busy={pending}>
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-line bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          {error}
        </p>
      ) : null}

      {children}
    </form>
  );
}
