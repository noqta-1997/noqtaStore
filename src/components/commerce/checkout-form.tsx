"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { placeOrder } from "@/app/actions/checkout";
import { useToast } from "@/components/ui/toast";

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
 * reaches it through `form="checkout-form"`.
 */
export function CheckoutForm({
  messages,
  className,
  children,
}: CheckoutFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const result = await placeOrder(new FormData(event.currentTarget));

    if (result.ok) {
      toast({ title: messages.placed, description: result.message });
      router.push(`/checkout/success?order=${result.message}`);
      router.refresh();
      return;
    }

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
  };

  return (
    <form id="checkout-form" className={className} onSubmit={onSubmit}>
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
