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
import { COUPON_COOKIE, evaluateCoupon } from "@/lib/coupon";
import { prisma } from "@/lib/prisma";
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

  const lines = await prisma.cartItem.findMany({
    where: { customerId: customer.id },
    include: { book: { select: { id: true, price: true, stock: true } } },
  });

  if (!lines.length) return fail("emptyCart");

  const shortage = lines.find((line) => line.book.stock < line.quantity);
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
  const subtotal = lines.reduce(
    (total, item) => total + item.book.price * item.quantity,
    0,
  );
  const rules = await getShippingRules();
  const shippingCost = shippingCostFor(shippingMethod, subtotal, rules);

  // The code is re-checked here: it may have expired between cart and confirm.
  const jar = await cookies();
  const code = jar.get(COUPON_COOKIE)?.value;
  const applied = code ? await evaluateCoupon(code, subtotal) : null;
  const discount = applied?.ok ? applied.coupon.discount : 0;

  const order = await prisma.$transaction(async (tx) => {
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
        timeline: { create: [{ status: "pending" }] },
      },
    });

    for (const item of lines) {
      await tx.book.update({
        where: { id: item.bookId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { customerId: customer.id } });

    if (applied?.ok) {
      await tx.coupon.update({
        where: { code: applied.coupon.code },
        data: { usedCount: { increment: 1 } },
      });
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

  // A code is spent once; the next order starts without it.
  jar.delete(COUPON_COOKIE);

  revalidatePath("/[locale]/cart", "page");
  revalidatePath("/[locale]/account/orders", "page");

  return ok(order.reference);
}
