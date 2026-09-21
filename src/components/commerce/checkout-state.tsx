"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { SummaryTotalRows, type SummaryLabels } from "@/components/commerce/order-summary";
import { buttonStyles } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";

/** The element id the form, its outside submit button and the totals share. */
export const CHECKOUT_FORM_ID = "checkout-form";

interface CheckoutState {
  pending: boolean;
  setPending: (pending: boolean) => void;
}

const CheckoutContext = createContext<CheckoutState | null>(null);

/**
 * One `pending` flag for the whole checkout.
 *
 * The form and its submit button are not in the same subtree — the button
 * sits in the summary sidebar and reaches the form through `form=` — so a
 * flag kept inside the form could not disable the button. This provider
 * wraps both; its children stay server-rendered, it only passes them
 * through.
 */
export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(false);
  const value = useMemo(() => ({ pending, setPending }), [pending]);

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckoutState(): CheckoutState {
  const context = useContext(CheckoutContext);
  if (!context) throw new Error("useCheckoutState must be used inside <CheckoutProvider>");
  return context;
}

/**
 * The "place order" button. Disabled while the order is being written, so a
 * second click cannot place a second order; the form refuses the repeat as
 * well, for a keyboard Enter that never touches this button.
 */
export function CheckoutSubmitButton({ label }: { label: string }) {
  const { pending } = useCheckoutState();

  return (
    <button
      type="submit"
      form={CHECKOUT_FORM_ID}
      disabled={pending}
      aria-busy={pending}
      className={buttonStyles({ size: "lg", fullWidth: true })}
    >
      {label}
    </button>
  );
}

interface CheckoutTotalsProps {
  subtotal: number;
  discount: number;
  /** The shipping charge for each method the form offers. */
  shippingByMethod: Record<string, number>;
  /** The method checked when the page is drawn. */
  defaultMethod: string;
  locale: Locale;
  labels: SummaryLabels;
}

/**
 * The summary's totals, following the shipping method the reader picks.
 *
 * The rows were drawn once on the server with the standard rate, so choosing
 * express changed the charge without changing the total on screen: the
 * reader confirmed one figure and was billed another. This listens to the
 * form's change events — the radios are still plain inputs the server
 * renders — and redraws the same rows with the chosen method's charge. The
 * server recomputes everything when the order is placed; this only keeps
 * what is shown honest.
 */
export function CheckoutTotals({
  subtotal,
  discount,
  shippingByMethod,
  defaultMethod,
  locale,
  labels,
}: CheckoutTotalsProps) {
  const [method, setMethod] = useState(defaultMethod);

  useEffect(() => {
    const form = document.getElementById(CHECKOUT_FORM_ID);
    if (!(form instanceof HTMLFormElement)) return;

    const read = () => {
      const chosen = new FormData(form).get("shippingMethod");
      if (typeof chosen === "string" && chosen in shippingByMethod) setMethod(chosen);
    };

    // The browser may restore a previous choice on a back navigation.
    read();
    form.addEventListener("change", read);
    return () => form.removeEventListener("change", read);
  }, [shippingByMethod]);

  const shipping = shippingByMethod[method] ?? shippingByMethod[defaultMethod] ?? 0;

  return (
    <SummaryTotalRows
      totals={{ subtotal, shipping, discount, total: subtotal + shipping - discount }}
      locale={locale}
      labels={labels}
    />
  );
}
