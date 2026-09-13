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

/** The handout pages are cached the same way; only they list handouts. */
function revalidateHandouts() {
  revalidatePath("/handouts", "page");
  revalidatePath("/handouts/[slug]", "page");
  revalidatePath("/admin/handouts", "page");
}

/* ------------------------------------------------------------------ */
/* Books                                                               */
/* ------------------------------------------------------------------ */

export async function saveBook(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const titleAr = text(formData, "titleAr");
  if (!titleAr) return fail("missingTitle");

  const authorId = text(formData, "authorId");
  const categoryId = text(formData, "categoryId");
  const publisherId = text(formData, "publisherId");
  if (!authorId || !categoryId || !publisherId) return fail("missingRelation");

  const bookId = text(formData, "bookId");

  /*
   * What the form still edits.
   *
   * The slug, ISBN, cover type and weight were taken off the form. They are
   * deliberately absent here rather than defaulted, because this object is the
   * update payload: writing a fallback into it would mean every edit silently
   * replaced the real ISBN with a `TEMP-` string, reset a hardcover to
   * paperback, zeroed the weight, and — worst — regenerated the slug from the
   * title, changing the book's public URL out from under any link to it.
   */
  const data = {
    titleAr,
    descriptionAr: text(formData, "descriptionAr"),
    price: number(formData, "price"),
    compareAtPrice: optionalNumber(formData, "compareAtPrice"),
    stock: number(formData, "stock"),
    pages: number(formData, "pages"),
    publishedYear: number(formData, "publishedYear", new Date().getFullYear()),
    tags: formData.getAll("tags").filter((tag): tag is string => typeof tag === "string") as BookTag[],
    authorId,
    categoryId,
    publisherId,
  } as const;

  try {
    if (bookId) {
      await prisma.book.update({ where: { id: bookId }, data });
    } else {
      /*
       * A new row still needs the four: `slug` and `isbn` are unique and
       * non-null, `weightGrams` is non-null, and `coverType` has a schema
       * default the create is explicit about. They are derived once, here, and
       * never touched again — the slug from the title, the ISBN as a
       * placeholder the owner can correct in the database if a real one
       * arrives.
       */
      await prisma.book.create({
        data: {
          ...data,
          slug: slugify(titleAr, `book-${Date.now()}`),
          isbn: `TEMP-${Date.now()}`,
          coverType: "paperback",
          weightGrams: 0,
        },
      });
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
/* Handouts                                                            */
/* ------------------------------------------------------------------ */

/** `saveBook` over the handouts table — the form and its fields are the same. */
export async function saveHandout(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const titleAr = text(formData, "titleAr");
  if (!titleAr) return fail("missingTitle");

  const authorId = text(formData, "authorId");
  const categoryId = text(formData, "categoryId");
  const publisherId = text(formData, "publisherId");
  if (!authorId || !categoryId || !publisherId) return fail("missingRelation");

  const handoutId = text(formData, "handoutId");

  // The update payload: slug, ISBN, cover type and weight are absent for the
  // same reason they are in `saveBook` — an edit must not regenerate them.
  const data = {
    titleAr,
    descriptionAr: text(formData, "descriptionAr"),
    price: number(formData, "price"),
    compareAtPrice: optionalNumber(formData, "compareAtPrice"),
    stock: number(formData, "stock"),
    pages: number(formData, "pages"),
    publishedYear: number(formData, "publishedYear", new Date().getFullYear()),
    tags: formData.getAll("tags").filter((tag): tag is string => typeof tag === "string") as BookTag[],
    authorId,
    categoryId,
    publisherId,
  } as const;

  try {
    if (handoutId) {
      await prisma.handout.update({ where: { id: handoutId }, data });
    } else {
      await prisma.handout.create({
        data: {
          ...data,
          slug: slugify(titleAr, `handout-${Date.now()}`),
          isbn: `TEMP-${Date.now()}`,
          coverType: "paperback",
          weightGrams: 0,
        },
      });
    }
  } catch {
    return fail("duplicate");
  }

  revalidateHandouts();
  return ok();
}

export async function deleteHandout(handoutId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  // No `inUse` guard yet: nothing references a handout until the cart and
  // orders learn about them.
  await prisma.handout.delete({ where: { id: handoutId } });

  revalidateHandouts();
  return ok();
}

/* ------------------------------------------------------------------ */
/* Categories and authors                                              */
/* ------------------------------------------------------------------ */

export async function saveCategory(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const nameAr = text(formData, "nameAr");
  if (!nameAr) return fail("missingTitle");

  /* The slug left the form; see the note in `saveBook` for why it is absent
     from the update payload rather than defaulted into it. */
  const data = {
    nameAr,
    descriptionAr: text(formData, "descriptionAr"),
    icon: text(formData, "icon") || "BookOpen",
  };

  const categoryId = text(formData, "categoryId");

  try {
    if (categoryId) {
      await prisma.category.update({ where: { id: categoryId }, data });
    } else {
      await prisma.category.create({
        data: { ...data, slug: slugify(nameAr, `category-${Date.now()}`) },
      });
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
  if (!nameAr) return fail("missingTitle");

  /* Country and slug left the form. `countryAr` is non-null with no schema
     default, so a create supplies an empty string; an update leaves whatever
     the row already holds. */
  const data = {
    nameAr,
    bioAr: text(formData, "bioAr"),
  };

  const authorId = text(formData, "authorId");

  try {
    if (authorId) {
      await prisma.author.update({ where: { id: authorId }, data });
    } else {
      await prisma.author.create({
        data: {
          ...data,
          slug: slugify(nameAr, `author-${Date.now()}`),
          countryAr: "",
        },
      });
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
  if (!nameAr) return fail("missingTitle");

  /* Country, founding year and slug left the form. `countryAr` defaults to ""
     in the schema and `foundedYear` is nullable, so a create needs neither;
     only the unique slug has to be derived. */
  const data = {
    nameAr,
    descriptionAr: text(formData, "descriptionAr"),
  };

  const publisherId = text(formData, "publisherId");

  try {
    if (publisherId) {
      await prisma.publisher.update({ where: { id: publisherId }, data });
    } else {
      await prisma.publisher.create({
        data: { ...data, slug: slugify(nameAr, `publisher-${Date.now()}`) },
      });
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

/**
 * Statuses whose copies are still on the shelf.
 *
 * `placeOrder` decrements stock at checkout, so an order that falls through
 * before dispatch has to put the copies back or the count drifts down every
 * time a delivery is called off. Once an order ships the books have physically
 * left, so cancelling it afterwards records the outcome without inventing
 * stock — goods actually coming back are a new arrival, not an undo of a sale.
 */
const beforeDispatch: OrderStatus[] = ["pending", "processing"];

export async function updateOrderStatus(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const orderId = text(formData, "orderId");
  const status = text(formData, "status") as OrderStatus;

  if (!orderId || !orderStatuses.includes(status)) return fail("invalidStatus");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      items: { select: { bookId: true, quantity: true } },
    },
  });
  if (!order) return fail("notFound");
  if (order.status === status) return ok();

  // Leaving `cancelled` makes the order live again and takes the copies back
  // off the shelf; cancelling one that never shipped returns them.
  const reclaiming = order.status === "cancelled";
  const releasing =
    status === "cancelled" && beforeDispatch.includes(order.status);

  if (reclaiming) {
    const books = await prisma.book.findMany({
      where: { id: { in: order.items.map((item) => item.bookId) } },
      select: { id: true, stock: true },
    });
    const onShelf = new Map(books.map((book) => [book.id, book.stock]));

    const short = order.items.some(
      (item) => (onShelf.get(item.bookId) ?? 0) < item.quantity,
    );
    if (short) return fail("outOfStock");
  }

  const stockMoves =
    reclaiming || releasing
      ? order.items.map((item) =>
          prisma.book.update({
            where: { id: item.bookId },
            data: {
              stock: reclaiming
                ? { decrement: item.quantity }
                : { increment: item.quantity },
            },
          }),
        )
      : [];

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status } }),
    prisma.orderEvent.create({ data: { orderId, status } }),
    ...stockMoves,
  ]);

  if (stockMoves.length) revalidateCatalogue();
  revalidatePath("/[locale]/admin/orders", "page");
  revalidatePath("/[locale]/account/orders", "page");
  return ok();
}

/**
 * Removes an order and everything hanging off it.
 *
 * Cancelling is the tool for an order that fell through; this is for a record
 * that should not exist at all. `OrderItem` and `OrderEvent` cascade with the
 * row, and copies from an order that never shipped go back on the shelf under
 * the same rule `updateOrderStatus` follows.
 *
 * A delivered order is refused outright: money changed hands and the books
 * left the shop, so the row is the only remaining evidence of the sale and the
 * reports are built from it. The table hides the control on those rows, but
 * the check lives here because that is the half a caller cannot skip.
 */
export async function deleteOrder(orderId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      items: { select: { bookId: true, quantity: true } },
    },
  });
  if (!order) return fail("notFound");
  if (order.status === "delivered") return fail("deliveredProtected");

  const releasing = beforeDispatch.includes(order.status);

  await prisma.$transaction([
    prisma.order.delete({ where: { id: orderId } }),
    ...(releasing
      ? order.items.map((item) =>
          prisma.book.update({
            where: { id: item.bookId },
            data: { stock: { increment: item.quantity } },
          }),
        )
      : []),
  ]);

  if (releasing) revalidateCatalogue();
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
      "taglineAr",
      "email",
      "phone",
      "address",
      "currency",
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
