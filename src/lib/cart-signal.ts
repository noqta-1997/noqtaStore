"use client";

/**
 * Cart writes happen inside client components scattered across the tree, while
 * the badge that counts them lives in the header. A tiny broadcast keeps them
 * in step without lifting the cart into a context every page would pay for.
 */
const listeners = new Set<() => void>();

export function subscribeToCartChanges(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** Called after a cart write succeeds. */
export function notifyCartChanged() {
  listeners.forEach((listener) => listener());
}
