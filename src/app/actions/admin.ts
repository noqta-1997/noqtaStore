"use server";

import { revalidatePath } from "next/cache";

import {
  checkbox,
  fail,
  number,
  ok,
  optionalNumber,
  text,
  type ActionResult,
} from "@/lib/action-result";
import { getCurrentCustomer } from "@/lib/auth";
import { isOwner } from "@/lib/owner";
import { refreshBookRating } from "@/lib/book-rating";
import { prisma } from "@/lib/prisma";
import type {
  BookTag,
  ContactStatus,
  CouponType,
  CoverType,
  OrderStatus,
  ReviewStatus,
} from "@/types";

/** Every write below is refused unless the caller holds the admin role. */
async function requireManager() {
  const customer = await getCurrentCustomer();
  return customer?.role === "admin" ? customer : null;
}

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9ء-ي]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

/** Storefront pages are cached, so catalogue writes must invalidate them. */
function revalidateCatalogue() {
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/books", "page");
  revalidatePath("/[locale]/books/[slug]", "page");
  revalidatePath("/[locale]/categories", "page");
  revalidatePath("/[locale]/categories/[slug]", "page");
  revalidatePath("/[locale]/authors", "page");
  revalidatePath("/[locale]/authors/[slug]", "page");
  revalidatePath("/[locale]/publishers", "page");
  revalidatePath("/[locale]/publishers/[slug]", "page");
}

/* ------------------------------------------------------------------ */
/* Books                                                               */
/* ------------------------------------------------------------------ */

export async function saveBook(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const titleAr = text(formData, "titleAr");
  const titleEn = text(formData, "titleEn");
  if (!titleAr || !titleEn) return fail("missingTitle");

  const authorId = text(formData, "authorId");
  const categoryId = text(formData, "categoryId");
  const publisherId = text(formData, "publisherId");
  if (!authorId || !categoryId || !publisherId) return fail("missingRelation");

  const bookId = text(formData, "bookId");
  const coverType = text(formData, "coverType") as CoverType;

  const data = {
    titleAr,
    titleEn,
    slug: slugify(text(formData, "slug") || titleEn, `book-${Date.now()}`),
    descriptionAr: text(formData, "descriptionAr"),
    descriptionEn: text(formData, "descriptionEn"),
    price: number(formData, "price"),
    compareAtPrice: optionalNumber(formData, "compareAtPrice"),
    stock: number(formData, "stock"),
    pages: number(formData, "pages"),
    publishedYear: number(formData, "publishedYear", new Date().getFullYear()),
    isbn: text(formData, "isbn") || `TEMP-${Date.now()}`,
    coverType: coverType === "hardcover" ? "hardcover" : "paperback",
    weightGrams: number(formData, "weightGrams"),
    tags: formData.getAll("tags").filter((tag): tag is string => typeof tag === "string") as BookTag[],
    authorId,
    categoryId,
    publisherId,
  } as const;

  try {
    if (bookId) {
      await prisma.book.update({ where: { id: bookId }, data });
    } else {
      await prisma.book.create({ data });
    }
  } catch {
    return fail("duplicate");
  }

  revalidateCatalogue();
  revalidatePath("/[locale]/admin/books", "page");
  return ok();
}

export async function deleteBook(bookId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const ordered = await prisma.orderItem.count({ where: { bookId } });
  if (ordered > 0) return fail("inUse");

  await prisma.book.delete({ where: { id: bookId } });

  revalidateCatalogue();
  revalidatePath("/[locale]/admin/books", "page");
  return ok();
}

/* ------------------------------------------------------------------ */
/* Categories and authors                                              */
/* ------------------------------------------------------------------ */

export async function saveCategory(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const nameAr = text(formData, "nameAr");
  const nameEn = text(formData, "nameEn");
  if (!nameAr || !nameEn) return fail("missingTitle");

  const data = {
    nameAr,
    nameEn,
    slug: slugify(text(formData, "slug") || nameEn, `category-${Date.now()}`),
    descriptionAr: text(formData, "descriptionAr"),
    descriptionEn: text(formData, "descriptionEn"),
    icon: text(formData, "icon") || "BookOpen",
  };

  const categoryId = text(formData, "categoryId");

  try {
    if (categoryId) {
      await prisma.category.update({ where: { id: categoryId }, data });
    } else {
      await prisma.category.create({ data });
    }
  } catch {
    return fail("duplicate");
  }

  revalidateCatalogue();
  revalidatePath("/[locale]/admin/categories", "page");
  return ok();
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const books = await prisma.book.count({ where: { categoryId } });
  if (books > 0) return fail("inUse");

  await prisma.category.delete({ where: { id: categoryId } });

  revalidateCatalogue();
  revalidatePath("/[locale]/admin/categories", "page");
  return ok();
}

export async function saveAuthor(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const nameAr = text(formData, "nameAr");
  const nameEn = text(formData, "nameEn");
  if (!nameAr || !nameEn) return fail("missingTitle");

  const data = {
    nameAr,
    nameEn,
    slug: slugify(text(formData, "slug") || nameEn, `author-${Date.now()}`),
    countryAr: text(formData, "countryAr"),
    countryEn: text(formData, "countryEn"),
    bioAr: text(formData, "bioAr"),
    bioEn: text(formData, "bioEn"),
  };

  const authorId = text(formData, "authorId");

  try {
    if (authorId) {
      await prisma.author.update({ where: { id: authorId }, data });
    } else {
      await prisma.author.create({ data });
    }
  } catch {
    return fail("duplicate");
  }

  revalidateCatalogue();
  revalidatePath("/[locale]/admin/authors", "page");
  return ok();
}

export async function deleteAuthor(authorId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const books = await prisma.book.count({ where: { authorId } });
  if (books > 0) return fail("inUse");

  await prisma.author.delete({ where: { id: authorId } });

  revalidateCatalogue();
  revalidatePath("/[locale]/admin/authors", "page");
  return ok();
}

export async function savePublisher(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const nameAr = text(formData, "nameAr");
  const nameEn = text(formData, "nameEn");
  if (!nameAr || !nameEn) return fail("missingTitle");

  const foundedYear = optionalNumber(formData, "foundedYear");

  const data = {
    nameAr,
    nameEn,
    slug: slugify(text(formData, "slug") || nameEn, `publisher-${Date.now()}`),
    countryAr: text(formData, "countryAr"),
    countryEn: text(formData, "countryEn"),
    descriptionAr: text(formData, "descriptionAr"),
    descriptionEn: text(formData, "descriptionEn"),
    foundedYear: foundedYear && foundedYear > 0 ? Math.round(foundedYear) : null,
  };

  const publisherId = text(formData, "publisherId");

  try {
    if (publisherId) {
      await prisma.publisher.update({ where: { id: publisherId }, data });
    } else {
      await prisma.publisher.create({ data });
    }
  } catch {
    return fail("duplicate");
  }

  revalidateCatalogue();
  revalidatePath("/[locale]/admin/publishers", "page");
  return ok();
}

export async function deletePublisher(publisherId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const books = await prisma.book.count({ where: { publisherId } });
  if (books > 0) return fail("inUse");

  await prisma.publisher.delete({ where: { id: publisherId } });

  revalidateCatalogue();
  revalidatePath("/[locale]/admin/publishers", "page");
  return ok();
}

/* ------------------------------------------------------------------ */
/* Orders, reviews and customers                                       */
/* ------------------------------------------------------------------ */

const orderStatuses: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export async function updateOrderStatus(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const orderId = text(formData, "orderId");
  const status = text(formData, "status") as OrderStatus;

  if (!orderId || !orderStatuses.includes(status)) return fail("invalidStatus");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  if (!order) return fail("notFound");
  if (order.status === status) return ok();

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status } }),
    prisma.orderEvent.create({ data: { orderId, status } }),
  ]);

  revalidatePath("/[locale]/admin/orders", "page");
  revalidatePath("/[locale]/account/orders", "page");
  return ok();
}

export async function setReviewStatus(
  reviewId: string,
  status: ReviewStatus,
): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { bookId: true },
  });
  if (!review) return fail("notFound");

  await prisma.$transaction(async (tx) => {
    await tx.review.update({ where: { id: reviewId }, data: { status } });
    await refreshBookRating(tx, review.bookId);
  });

  revalidatePath("/[locale]/admin/reviews", "page");
  revalidateCatalogue();
  return ok();
}

export async function toggleCustomerBlock(customerId: string): Promise<ActionResult> {
  const manager = await requireManager();
  if (!manager) return fail("forbidden");
  if (manager.id === customerId) return fail("selfBlock");

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { status: true, email: true },
  });
  if (!customer) return fail("notFound");
  if (isOwner(customer.email)) return fail("ownerProtected");

  await prisma.customer.update({
    where: { id: customerId },
    data: { status: customer.status === "active" ? "blocked" : "active" },
  });

  revalidatePath("/[locale]/admin/customers", "page");
  return ok();
}

/* ------------------------------------------------------------------ */
/* Coupons                                                             */
/* ------------------------------------------------------------------ */

/** Codes are typed by readers, so they are stored in one canonical case. */
function normaliseCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export async function saveCoupon(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const code = normaliseCode(text(formData, "code"));
  if (!code) return fail("missingCode");

  const type: CouponType = text(formData, "type") === "fixed" ? "fixed" : "percentage";
  const value = number(formData, "value");

  if (value <= 0) return fail("invalidValue");
  if (type === "percentage" && value > 100) return fail("invalidValue");

  const expiresAt = text(formData, "expiresAt");
  const usageLimit = optionalNumber(formData, "usageLimit");

  const data = {
    code,
    type,
    value,
    minSubtotal: Math.max(number(formData, "minSubtotal"), 0),
    active: checkbox(formData, "active"),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    usageLimit: usageLimit && usageLimit > 0 ? Math.round(usageLimit) : null,
  };

  const couponId = text(formData, "couponId");

  try {
    if (couponId) {
      await prisma.coupon.update({ where: { id: couponId }, data });
    } else {
      await prisma.coupon.create({ data });
    }
  } catch {
    return fail("duplicate");
  }

  revalidatePath("/[locale]/admin/coupons", "page");
  return ok();
}

export async function deleteCoupon(couponId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const removed = await prisma.coupon.deleteMany({ where: { id: couponId } });
  if (!removed.count) return fail("notFound");

  revalidatePath("/[locale]/admin/coupons", "page");
  return ok();
}

export async function toggleCoupon(couponId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    select: { active: true },
  });
  if (!coupon) return fail("notFound");

  await prisma.coupon.update({
    where: { id: couponId },
    data: { active: !coupon.active },
  });

  revalidatePath("/[locale]/admin/coupons", "page");
  return ok();
}

/* ------------------------------------------------------------------ */
/* Messages and subscribers                                            */
/* ------------------------------------------------------------------ */

export async function setMessageStatus(
  messageId: string,
  status: ContactStatus,
): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const updated = await prisma.contactMessage.updateMany({
    where: { id: messageId },
    data: { status },
  });
  if (!updated.count) return fail("notFound");

  revalidatePath("/[locale]/admin/messages", "page");
  return ok();
}

export async function deleteContactMessage(messageId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const removed = await prisma.contactMessage.deleteMany({ where: { id: messageId } });
  if (!removed.count) return fail("notFound");

  revalidatePath("/[locale]/admin/messages", "page");
  return ok();
}

export async function removeSubscriber(email: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const removed = await prisma.newsletterSubscriber.deleteMany({ where: { email } });
  if (!removed.count) return fail("notFound");

  revalidatePath("/[locale]/admin/messages", "page");
  return ok();
}

/* ------------------------------------------------------------------ */
/* Store settings                                                      */
/* ------------------------------------------------------------------ */

/**
 * The settings screen posts one section at a time. Naming the fields each
 * section owns keeps a crafted form from writing keys nobody renders, and
 * tells the action which checkboxes an absent value should clear.
 */
const settingSections = {
  store: {
    fields: [
      "nameAr",
      "nameEn",
      "taglineAr",
      "taglineEn",
      "email",
      "phone",
      "address",
      "currency",
      "defaultLocale",
    ],
    flags: [],
  },
  shipping: {
    fields: ["standardCost", "expressCost", "freeThreshold", "estimatedDays"],
    flags: ["enablePickup"],
  },
  payments: { fields: ["paymentDefault"], flags: [] },
  adminProfile: { fields: ["adminName", "adminEmail", "adminPhone"], flags: [] },
  adminNotifications: {
    fields: [],
    flags: ["notifyOrders", "notifyReviews", "notifyStock"],
  },
} as const satisfies Record<string, { fields: readonly string[]; flags: readonly string[] }>;

type SettingSection = keyof typeof settingSections;

export async function saveSettings(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const section = text(formData, "section") as SettingSection;
  const shape = settingSections[section];
  if (!shape) return fail("unknownSection");

  const entries: { key: string; value: string }[] = [
    ...shape.fields
      .map((key) => ({ key, value: text(formData, key) }))
      .filter((entry) => entry.value !== ""),
    // An unchecked box posts nothing, so absence is a deliberate `false`.
    ...shape.flags.map((key) => ({
      key,
      value: String(checkbox(formData, key)),
    })),
  ];

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.storeSetting.upsert({
        where: { key: entry.key },
        create: entry,
        update: { value: entry.value },
      }),
    ),
  );

  revalidatePath("/[locale]/admin/settings", "page");

  if (section === "shipping") {
    revalidatePath("/[locale]/cart", "page");
    revalidatePath("/[locale]/checkout", "page");
  }

  if (section === "payments") {
    revalidatePath("/[locale]/checkout", "page");
  }

  if (section === "adminNotifications") {
    // The bell lives in the admin layout, so the page alone is not enough.
    revalidatePath("/[locale]/admin", "layout");
  }

  if (section === "store") {
    // The name, tagline and contact lines are baked into the header, footer
    // and page titles of every prerendered storefront page.
    revalidatePath("/[locale]", "layout");
    revalidatePath("/", "page");
  }

  return ok();
}
