"use client";

import { useState } from "react";

import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { HandoutAddToCartButton } from "@/components/handout/handout-add-to-cart-button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

interface PurchaseControlsProps {
  /** Which cart table the button writes to. */
  kind: "book" | "handout";
  id: string;
  /** Copies on the shelf; the stepper stops there. */
  stock: number;
  disabled?: boolean;
  labels: {
    quantity: string;
    increase: string;
    decrease: string;
    addToCart: string;
    toastTitle: string;
    toastNote: string;
    signIn: string;
    outOfStock: string;
    failure: string;
  };
  className?: string;
}

/**
 * The stepper and the cart button of a detail page, sharing one number.
 *
 * They used to stand side by side as two independent islands: the stepper
 * kept its count to itself and the button always added a single copy, so a
 * reader who picked three and pressed the button got one. This holds the
 * count and hands it to the button; the markup is the same two controls, as
 * siblings, so the row they sit in lays out as before.
 */
export function PurchaseControls({
  kind,
  id,
  stock,
  disabled,
  labels,
  className,
}: PurchaseControlsProps) {
  const [quantity, setQuantity] = useState(1);

  const button = {
    size: "lg" as const,
    disabled,
    quantity,
    label: labels.addToCart,
    toastTitle: labels.toastTitle,
    toastNote: labels.toastNote,
    signInMessage: labels.signIn,
    outOfStockMessage: labels.outOfStock,
    failureMessage: labels.failure,
    className,
  };

  return (
    <>
      <QuantityStepper
        max={Math.max(stock, 1)}
        labels={{
          quantity: labels.quantity,
          increase: labels.increase,
          decrease: labels.decrease,
        }}
        onChange={setQuantity}
      />
      {kind === "book" ? (
        <AddToCartButton bookId={id} {...button} />
      ) : (
        <HandoutAddToCartButton handoutId={id} {...button} />
      )}
    </>
  );
}
