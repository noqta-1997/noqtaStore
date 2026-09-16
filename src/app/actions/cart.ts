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

  // A cart line holds at least one copy (CHECK on `quantity`); whatever the
  // caller sent, the request means "add".
  quantity = Math.max(1, Math.trunc(quantity) || 1);

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

  revalidatePath("/cart", "page");
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

  revalidatePath("/cart", "page");
  return ok();
}

export async function removeFromCart(bookId: string): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  await prisma.cartItem
    .delete({ where: { customerId_bookId: { customerId, bookId } } })
    .catch(() => null);

  revalidatePath("/cart", "page");
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
    revalidatePath("/account/wishlist", "page");
    return ok("removed");
  }

  await prisma.wishlistItem.create({ data: { customerId, bookId } });
  revalidatePath("/account/wishlist", "page");
  return ok("added");
}

/* ------------------------------------------------------------------ */
/* Handouts — the same four writes over the handout tables             */
/* ------------------------------------------------------------------ */

export async function addHandoutToCart(
  handoutId: string,
  quantity = 1,
): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  quantity = Math.max(1, Math.trunc(quantity) || 1);

  const handout = await prisma.handout.findUnique({
    where: { id: handoutId },
    select: { stock: true },
  });

  if (!handout) return fail("notFound");
  if (handout.stock <= 0) return fail("outOfStock");

  const existing = await prisma.handoutCartItem.findUnique({
    where: { customerId_handoutId: { customerId, handoutId } },
  });

  const next = Math.min((existing?.quantity ?? 0) + quantity, handout.stock);

  await prisma.handoutCartItem.upsert({
    where: { customerId_handoutId: { customerId, handoutId } },
    create: { customerId, handoutId, quantity: Math.min(quantity, handout.stock) },
    update: { quantity: next },
  });

  revalidatePath("/cart");
  return ok();
}

export async function setHandoutCartQuantity(
  handoutId: string,
  quantity: number,
): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  if (quantity <= 0) return removeHandoutFromCart(handoutId);

  const handout = await prisma.handout.findUnique({
    where: { id: handoutId },
    select: { stock: true },
  });
  if (!handout) return fail("notFound");

  await prisma.handoutCartItem.update({
    where: { customerId_handoutId: { customerId, handoutId } },
    data: { quantity: Math.min(quantity, Math.max(handout.stock, 1)) },
  });

  revalidatePath("/cart");
  return ok();
}

export async function removeHandoutFromCart(handoutId: string): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  await prisma.handoutCartItem
    .delete({ where: { customerId_handoutId: { customerId, handoutId } } })
    .catch(() => null);

  revalidatePath("/cart");
  return ok();
}

export async function toggleHandoutWishlist(handoutId: string): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const existing = await prisma.handoutWishlistItem.findUnique({
    where: { customerId_handoutId: { customerId, handoutId } },
  });

  if (existing) {
    await prisma.handoutWishlistItem.delete({
      where: { customerId_handoutId: { customerId, handoutId } },
    });
    revalidatePath("/account/wishlist");
    return ok("removed");
  }

  await prisma.handoutWishlistItem.create({ data: { customerId, handoutId } });
  revalidatePath("/account/wishlist");
  return ok("added");
}

/** Moves every saved book and handout into the cart, respecting stock. */
export async function addWishlistToCart(): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const [saved, savedHandouts] = await Promise.all([
    prisma.wishlistItem.findMany({
      where: { customerId },
      include: { book: { select: { id: true, stock: true } } },
    }),
    prisma.handoutWishlistItem.findMany({
      where: { customerId },
      include: { handout: { select: { id: true, stock: true } } },
    }),
  ]);

  const available = saved.filter((item) => item.book.stock > 0);
  const availableHandouts = savedHandouts.filter((item) => item.handout.stock > 0);

  await prisma.$transaction([
    ...available.map((item) =>
      prisma.cartItem.upsert({
        where: { customerId_bookId: { customerId, bookId: item.bookId } },
        create: { customerId, bookId: item.bookId, quantity: 1 },
        update: {},
      }),
    ),
    ...availableHandouts.map((item) =>
      prisma.handoutCartItem.upsert({
        where: { customerId_handoutId: { customerId, handoutId: item.handoutId } },
        create: { customerId, handoutId: item.handoutId, quantity: 1 },
        update: {},
      }),
    ),
  ]);

  revalidatePath("/cart", "page");
  return ok(String(available.length + availableHandouts.length));
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
    include: {
      items: { include: { book: { select: { id: true, stock: true } } } },
      handoutItems: { include: { handout: { select: { id: true, stock: true } } } },
    },
  });

  if (!order) return fail("notFound");

  const available = order.items.filter((item) => item.book.stock > 0);
  const availableHandouts = order.handoutItems.filter((item) => item.handout.stock > 0);
  if (!available.length && !availableHandouts.length) return fail("outOfStock");

  await prisma.$transaction([
    ...available.map((item) =>
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
    ...availableHandouts.map((item) =>
      prisma.handoutCartItem.upsert({
        where: { customerId_handoutId: { customerId, handoutId: item.handoutId } },
        create: {
          customerId,
          handoutId: item.handoutId,
          quantity: Math.min(item.quantity, item.handout.stock),
        },
        update: { quantity: Math.min(item.quantity, item.handout.stock) },
      }),
    ),
  ]);

  revalidatePath("/cart", "page");
  return ok(String(available.length + availableHandouts.length));
}

/* ------------------------------------------------------------------ */
/* Coupons                                                             */
/* ------------------------------------------------------------------ */

/** The subtotal a code is judged against comes from the cart, not the form. */
async function cartSubtotal(customerId: string): Promise<number> {
  const [lines, handoutLines] = await Promise.all([
    prisma.cartItem.findMany({
      where: { customerId },
      include: { book: { select: { price: true } } },
    }),
    prisma.handoutCartItem.findMany({
      where: { customerId },
      include: { handout: { select: { price: true } } },
    }),
  ]);

  return (
    lines.reduce((total, line) => total + line.book.price * line.quantity, 0) +
    handoutLines.reduce((total, line) => total + line.handout.price * line.quantity, 0)
  );
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

  revalidatePath("/cart", "page");
  revalidatePath("/checkout", "page");
  return ok(result.coupon.code);
}

export async function clearCoupon(): Promise<ActionResult> {
  (await cookies()).delete(COUPON_COOKIE);

  revalidatePath("/cart", "page");
  revalidatePath("/checkout", "page");
  return ok();
}
