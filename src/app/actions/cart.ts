"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { fail, ok, text, type ActionResult } from "@/lib/action-result";
import { getCurrentCustomer } from "@/lib/auth";
import { COUPON_COOKIE, evaluateCoupon } from "@/lib/coupon";
import { prisma } from "@/lib/prisma";

/** Signed-out readers are told to sign in rather than silently losing the item. */
async function requireCustomerId(): Promise<string | null> {
  const customer = await getCurrentCustomer();
  return customer?.id ?? null;
}

export async function addToCart(
  bookId: string,
  quantity = 1,
): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { stock: true },
  });

  if (!book) return fail("notFound");
  if (book.stock <= 0) return fail("outOfStock");

  const existing = await prisma.cartItem.findUnique({
    where: { customerId_bookId: { customerId, bookId } },
  });

  const next = Math.min((existing?.quantity ?? 0) + quantity, book.stock);

  await prisma.cartItem.upsert({
    where: { customerId_bookId: { customerId, bookId } },
    create: { customerId, bookId, quantity: Math.min(quantity, book.stock) },
    update: { quantity: next },
  });

  revalidatePath("/[locale]/cart", "page");
  return ok();
}

export async function setCartQuantity(
  bookId: string,
  quantity: number,
): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  if (quantity <= 0) return removeFromCart(bookId);

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { stock: true },
  });
  if (!book) return fail("notFound");

  await prisma.cartItem.update({
    where: { customerId_bookId: { customerId, bookId } },
    data: { quantity: Math.min(quantity, Math.max(book.stock, 1)) },
  });

  revalidatePath("/[locale]/cart", "page");
  return ok();
}

export async function removeFromCart(bookId: string): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  await prisma.cartItem
    .delete({ where: { customerId_bookId: { customerId, bookId } } })
    .catch(() => null);

  revalidatePath("/[locale]/cart", "page");
  return ok();
}

export async function toggleWishlist(bookId: string): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const existing = await prisma.wishlistItem.findUnique({
    where: { customerId_bookId: { customerId, bookId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({
      where: { customerId_bookId: { customerId, bookId } },
    });
    revalidatePath("/[locale]/account/wishlist", "page");
    return ok("removed");
  }

  await prisma.wishlistItem.create({ data: { customerId, bookId } });
  revalidatePath("/[locale]/account/wishlist", "page");
  return ok("added");
}

/** Moves every saved book into the cart, respecting stock. */
export async function addWishlistToCart(): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const saved = await prisma.wishlistItem.findMany({
    where: { customerId },
    include: { book: { select: { id: true, stock: true } } },
  });

  const available = saved.filter((item) => item.book.stock > 0);

  await prisma.$transaction(
    available.map((item) =>
      prisma.cartItem.upsert({
        where: { customerId_bookId: { customerId, bookId: item.bookId } },
        create: { customerId, bookId: item.bookId, quantity: 1 },
        update: {},
      }),
    ),
  );

  revalidatePath("/[locale]/cart", "page");
  return ok(String(available.length));
}

/**
 * Puts a past order back in the cart. Books that have since sold out or been
 * withdrawn are skipped rather than blocking the rest — the message reports
 * how many lines made it.
 */
export async function reorder(orderId: string): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId },
    include: { items: { include: { book: { select: { id: true, stock: true } } } } },
  });

  if (!order) return fail("notFound");

  const available = order.items.filter((item) => item.book.stock > 0);
  if (!available.length) return fail("outOfStock");

  await prisma.$transaction(
    available.map((item) =>
      prisma.cartItem.upsert({
        where: { customerId_bookId: { customerId, bookId: item.bookId } },
        create: {
          customerId,
          bookId: item.bookId,
          quantity: Math.min(item.quantity, item.book.stock),
        },
        update: { quantity: Math.min(item.quantity, item.book.stock) },
      }),
    ),
  );

  revalidatePath("/[locale]/cart", "page");
  return ok(String(available.length));
}

/* ------------------------------------------------------------------ */
/* Coupons                                                             */
/* ------------------------------------------------------------------ */

/** The subtotal a code is judged against comes from the cart, not the form. */
async function cartSubtotal(customerId: string): Promise<number> {
  const lines = await prisma.cartItem.findMany({
    where: { customerId },
    include: { book: { select: { price: true } } },
  });

  return lines.reduce((total, line) => total + line.book.price * line.quantity, 0);
}

export async function applyCoupon(formData: FormData): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const code = text(formData, "coupon");
  if (!code) return fail("unknownCoupon");

  const result = await evaluateCoupon(code, await cartSubtotal(customerId));
  if (!result.ok) return fail(result.error);

  (await cookies()).set(COUPON_COOKIE, result.coupon.code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  revalidatePath("/[locale]/cart", "page");
  revalidatePath("/[locale]/checkout", "page");
  return ok(result.coupon.code);
}

export async function clearCoupon(): Promise<ActionResult> {
  (await cookies()).delete(COUPON_COOKIE);

  revalidatePath("/[locale]/cart", "page");
  revalidatePath("/[locale]/checkout", "page");
  return ok();
}
