"use server";

import { revalidatePath } from "next/cache";

import {
  checkbox,
  fail,
  ok,
  text,
  type ActionResult,
} from "@/lib/action-result";
import { refreshBookRating } from "@/lib/book-rating";
import { refreshHandoutRating } from "@/lib/handout-rating";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireCustomerId() {
  const customer = await getCurrentCustomer();
  return customer?.id ?? null;
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const name = text(formData, "name");
  if (!name) return fail("missingName");

  const birthDate = text(formData, "birthDate");

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name,
      phone: text(formData, "phone"),
      birthDate: birthDate ? new Date(birthDate) : null,
    },
  });

  revalidatePath("/account", "page");
  return ok();
}

/** Creates when `addressId` is absent, updates when it is present. */
export async function saveAddress(formData: FormData): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const fields = {
    label: text(formData, "label"),
    fullName: text(formData, "fullName"),
    phone: text(formData, "phone"),
    governorate: text(formData, "governorate"),
    city: text(formData, "city"),
    line: text(formData, "line"),
    isDefault: checkbox(formData, "isDefault"),
  };

  if (!fields.label || !fields.fullName || !fields.phone || !fields.city) {
    return fail("missingAddress");
  }

  const addressId = text(formData, "addressId");

  await prisma.$transaction(async (tx) => {
    if (fields.isDefault) {
      await tx.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    if (addressId) {
      // The customerId in the filter stops one reader editing another's row.
      await tx.address.updateMany({
        where: { id: addressId, customerId },
        data: fields,
      });
      return;
    }

    await tx.address.create({ data: { ...fields, customerId } });
  });

  revalidatePath("/account/addresses", "page");
  return ok();
}

export async function deleteAddress(addressId: string): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  await prisma.address.deleteMany({ where: { id: addressId, customerId } });

  revalidatePath("/account/addresses", "page");
  return ok();
}

export async function setDefaultAddress(addressId: string): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  await prisma.$transaction([
    prisma.address.updateMany({ where: { customerId }, data: { isDefault: false } }),
    prisma.address.updateMany({
      where: { id: addressId, customerId },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/account/addresses", "page");
  return ok();
}

export async function deleteOwnReview(reviewId: string): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const review = await prisma.review.findFirst({
    where: { id: reviewId, customerId },
    select: { bookId: true },
  });

  if (!review) return fail("notFound");

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: reviewId } });
    await refreshBookRating(tx, review.bookId);
  });

  revalidatePath("/account/reviews", "page");
  return ok();
}

/** Marketing opt-ins. An unchecked box posts nothing, which reads as false. */
export async function savePreferences(formData: FormData): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      newsletterOptIn: checkbox(formData, "newsletter"),
      offersOptIn: checkbox(formData, "offers"),
    },
  });

  revalidatePath("/account", "page");
  return ok();
}

/**
 * A reader's own review. It lands as `pending`: the admin moderation queue
 * decides whether it appears on the book page.
 */
export async function submitReview(formData: FormData): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const bookId = text(formData, "bookId");
  const rating = Number(text(formData, "rating"));
  const title = text(formData, "title");
  const body = text(formData, "body");

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return fail("invalidRating");
  }
  if (!bookId || !title || !body) return fail("missingReview");

  const existing = await prisma.review.findUnique({
    where: { bookId_customerId: { bookId, customerId } },
  });
  if (existing) return fail("alreadyReviewed");

  await prisma.review.create({
    data: { bookId, customerId, rating, title, body },
  });

  revalidatePath("/account/reviews", "page");
  revalidatePath("/admin/reviews", "page");
  return ok();
}

/* ------------------------------------------------------------------ */
/* Handout reviews — the two review writes over the handout table      */
/* ------------------------------------------------------------------ */

export async function deleteOwnHandoutReview(reviewId: string): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const review = await prisma.handoutReview.findFirst({
    where: { id: reviewId, customerId },
    select: { handoutId: true },
  });

  if (!review) return fail("notFound");

  await prisma.$transaction(async (tx) => {
    await tx.handoutReview.delete({ where: { id: reviewId } });
    await refreshHandoutRating(tx, review.handoutId);
  });

  revalidatePath("/account/reviews");
  return ok();
}

/** A reader's own handout review; `pending` until the moderation queue decides. */
export async function submitHandoutReview(formData: FormData): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  const handoutId = text(formData, "handoutId");
  const rating = Number(text(formData, "rating"));
  const title = text(formData, "title");
  const body = text(formData, "body");

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return fail("invalidRating");
  }
  if (!handoutId || !title || !body) return fail("missingReview");

  const existing = await prisma.handoutReview.findUnique({
    where: { handoutId_customerId: { handoutId, customerId } },
  });
  if (existing) return fail("alreadyReviewed");

  await prisma.handoutReview.create({
    data: { handoutId, customerId, rating, title, body },
  });

  revalidatePath("/account/reviews");
  revalidatePath("/admin/handout-reviews");
  return ok();
}
