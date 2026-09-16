"use server";

import { randomInt } from "node:crypto";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  checkbox,
  fail,
  ok,
  text,
  type ActionResult,
} from "@/lib/action-result";
import { getCurrentCustomer } from "@/lib/auth";
import { COUPON_COOKIE, CouponSpent, evaluateCoupon, spendCoupon } from "@/lib/coupon";
import { prisma } from "@/lib/prisma";
import { isCheckViolation } from "@/lib/prisma-errors";
import { ShortStock, takeFromShelf } from "@/lib/shelf";
import { getShippingRules, type ShippingRules } from "@/data";

const shippingMethods = ["standard", "express", "pickup"] as const;
const paymentMethods = ["cod", "card", "wallet"] as const;

type ShippingMethod = (typeof shippingMethods)[number];
type PaymentMethod = (typeof paymentMethods)[number];

function shippingCostFor(
  method: ShippingMethod,
  subtotal: number,
  rules: ShippingRules,
) {
  if (method === "pickup") return 0;
  if (method === "express") return rules.expressCost;
  return subtotal >= rules.freeThreshold ? 0 : rules.standardCost;
}

function newReference() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `NQ-${today}-${randomInt(1000, 9999)}`;
}

/**
 * Turns the cart into an order: totals are recomputed on the server from
 * current catalogue prices, stock is decremented and the cart is emptied —
 * all inside one transaction so a failure leaves nothing half-written.
 */
export async function placeOrder(formData: FormData): Promise<ActionResult> {
  const customer = await getCurrentCustomer();
  if (!customer) return fail("unauthenticated");

  // Both halves of the cart go into one order.
  const [lines, handoutLines] = await Promise.all([
    prisma.cartItem.findMany({
      where: { customerId: customer.id },
      include: { book: { select: { id: true, price: true, stock: true } } },
    }),
    prisma.handoutCartItem.findMany({
      where: { customerId: customer.id },
      include: { handout: { select: { id: true, price: true, stock: true } } },
    }),
  ]);

  if (!lines.length && !handoutLines.length) return fail("emptyCart");

  // A quick answer before the address is even read; the check that holds is
  // `takeFromShelf` inside the transaction, which cannot be raced.
  const shortage =
    lines.find((line) => line.book.stock < line.quantity) ??
    handoutLines.find((line) => line.handout.stock < line.quantity);
  if (shortage) return fail("outOfStock");

  const rawShipping = text(formData, "shippingMethod") as ShippingMethod;
  const rawPayment = text(formData, "paymentMethod") as PaymentMethod;
  const shippingMethod = shippingMethods.includes(rawShipping)
    ? rawShipping
    : "standard";
  const paymentMethod = paymentMethods.includes(rawPayment) ? rawPayment : "cod";

  const fullName = text(formData, "fullName");
  const phone = text(formData, "phone");
  const governorate = text(formData, "governorate");
  const city = text(formData, "city");
  const line = text(formData, "addressLine");

  if (!fullName || !phone || !governorate || !city || !line) {
    return fail("missingAddress");
  }

  // Prices come from the catalogue, never from the browser.
  const subtotal =
    lines.reduce((total, item) => total + item.book.price * item.quantity, 0) +
    handoutLines.reduce(
      (total, item) => total + item.handout.price * item.quantity,
      0,
    );
  const rules = await getShippingRules();
  const shippingCost = shippingCostFor(shippingMethod, subtotal, rules);

  // The code is re-checked here: it may have expired between cart and
  // confirm. If it has, the order is not quietly placed at full price under
  // a summary that showed a discount — the code is dropped and the customer
  // is told, so the total they confirm is the total they are charged.
  const jar = await cookies();
  const code = jar.get(COUPON_COOKIE)?.value;
  const applied = code ? await evaluateCoupon(code, subtotal) : null;
  if (applied && !applied.ok) {
    jar.delete(COUPON_COOKIE);
    return fail(applied.error);
  }
  const discount = applied?.ok ? applied.coupon.discount : 0;

  const transaction = prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        reference: newReference(),
        customerId: customer.id,
        status: "pending",
        subtotal,
        shippingCost,
        discount,
        total: subtotal + shippingCost - discount,
        paymentMethod,
        shippingMethod,
        shippingName: fullName,
        shippingPhone: phone,
        shippingGovernorate: governorate,
        shippingCity: city,
        shippingLine: line,
        notes: text(formData, "notes") || null,
        items: {
          create: lines.map((item) => ({
            bookId: item.bookId,
            quantity: item.quantity,
            unitPrice: item.book.price,
          })),
        },
        handoutItems: {
          create: handoutLines.map((item) => ({
            handoutId: item.handoutId,
            quantity: item.quantity,
            unitPrice: item.handout.price,
          })),
        },
        timeline: { create: [{ status: "pending" }] },
      },
    });

    for (const item of lines) {
      await takeFromShelf(tx, "book", item.bookId, item.quantity);
    }

    for (const item of handoutLines) {
      await takeFromShelf(tx, "handout", item.handoutId, item.quantity);
    }

    await tx.cartItem.deleteMany({ where: { customerId: customer.id } });
    await tx.handoutCartItem.deleteMany({ where: { customerId: customer.id } });

    if (applied?.ok) {
      await spendCoupon(tx, applied.coupon.code);
    }

    if (checkbox(formData, "saveAddress")) {
      await tx.address.create({
        data: {
          customerId: customer.id,
          label: city,
          fullName,
          phone,
          governorate,
          city,
          line,
        },
      });
    }

    return created;
  });

  // The last copy sold to someone else between the cart page and this click
  // rolls the whole order back — nothing is written, nothing is charged.
  let order: Awaited<typeof transaction>;
  try {
    order = await transaction;
  } catch (error) {
    if (error instanceof ShortStock) return fail("outOfStock");
    // The last use of the code went to another order while this one was
    // being written: same answer as an expired code, and the same cleanup.
    if (error instanceof CouponSpent) {
      jar.delete(COUPON_COOKIE);
      return fail("expiredCoupon");
    }
    if (isCheckViolation(error)) return fail("outOfStock");
    throw error;
  }

  // A code is spent once; the next order starts without it.
  jar.delete(COUPON_COOKIE);

  revalidatePath("/[locale]/cart", "page");
  revalidatePath("/[locale]/account/orders", "page");

  return ok(order.reference);
}
