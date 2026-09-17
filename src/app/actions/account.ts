"use server";

import { revalidatePath } from "next/cache";

import {
  checkbox,
  fail,
  ok,
  text,
  type ActionResult,
} from "@/lib/action-result";
import { makeDefaultAddress, saveAddressRow } from "@/lib/addresses";
import { refreshBookRating } from "@/lib/book-rating";
import { refreshHandoutRating } from "@/lib/handout-rating";
import { getCurrentCustomer, getCustomerInGoodStanding } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/prisma-errors";

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

  revalidatePath("/account");
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

  try {
    await saveAddressRow(customerId, fields, addressId || undefined);
  } catch (error) {
    logActionError("saveAddress", error, { addressId: addressId || null });
    return fail("saveFailed");
  }

  revalidatePath("/account/addresses");
  return ok();
}

export async function deleteAddress(addressId: string): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  await prisma.address.deleteMany({ where: { id: addressId, customerId } });

  revalidatePath("/account/addresses");
  return ok();
}

export async function setDefaultAddress(addressId: string): Promise<ActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return fail("unauthenticated");

  try {
    await makeDefaultAddress(customerId, addressId);
  } catch (error) {
    logActionError("setDefaultAddress", error, { addressId });
    return fail("saveFailed");
  }

  revalidatePath("/account/addresses");
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

  revalidatePath("/account/reviews");
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

  revalidatePath("/account");
  return ok();
}

/**
 * A reader's own review. It lands as `pending`: the admin moderation queue
 * decides whether it appears on the book page.
 */
export async function submitReview(formData: FormData): Promise<ActionResult> {
  // A blocked account keeps its lists and its history, but is not heard.
  const standing = await getCustomerInGoodStanding();
  if (!standing.ok) return fail(standing.error);
  const customerId = standing.customer.id;

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

  revalidatePath("/account/reviews");
  revalidatePath("/admin/reviews");
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
  const standing = await getCustomerInGoodStanding();
  if (!standing.ok) return fail(standing.error);
  const customerId = standing.customer.id;

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
