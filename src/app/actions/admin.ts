"use server";

import { revalidatePath } from "next/cache";

import {
  getCategoryById,
  getHandoutCategoryById,
  searchAuthorPicks,
  searchBookPicks,
  searchCategoryPicks,
  searchPublisherPicks,
} from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
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
import {
  HERO_DEFAULT_LINKS,
  HERO_KEYS,
  HERO_SHOWCASE_SIZE,
  HOME_SHELVES,
  HOME_TEXT_FIELDS,
  homeSectionKey,
  homeTextDefault,
  homeTextKey,
  isHomeSection,
  isHomeShelf,
  isSafeHref,
  PROMO_DEFAULTS,
  PROMO_FIGURE_MAX,
  PROMO_KEYS,
  shelfKeys,
  type HomeShelf,
  type ShelfKind,
} from "@/lib/home-sections";
import { isOwner } from "@/lib/owner";
import { refreshBookRating } from "@/lib/book-rating";
import { isWithin } from "@/lib/category-tree";
import { discardCover, readCoverImage, storeCover } from "@/lib/cover-storage";
import { refreshHandoutRating } from "@/lib/handout-rating";
import { prisma } from "@/lib/prisma";
import type {
  BookTag,
  ContactStatus,
  CouponType,
  OrderStatus,
  PickOption,
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
  revalidatePath("/", "page");
  revalidatePath("/books", "page");
  revalidatePath("/books/[slug]", "page");
  revalidatePath("/categories", "page");
  revalidatePath("/categories/[slug]", "page");
  revalidatePath("/authors", "page");
  revalidatePath("/authors/[slug]", "page");
  revalidatePath("/publishers", "page");
  revalidatePath("/publishers/[slug]", "page");
}

/**
 * The handout pages are cached the same way, and the category, author and
 * publisher pages carry a handouts section under their books — as does the
 * home page, where each featured press shelves its latest handouts.
 */
function revalidateHandouts() {
  revalidatePath("/", "page");
  revalidatePath("/handouts", "page");
  revalidatePath("/handouts/[slug]", "page");
  revalidatePath("/handouts/categories", "page");
  revalidatePath("/handouts/categories/[slug]", "page");
  revalidatePath("/categories/[slug]", "page");
  revalidatePath("/authors/[slug]", "page");
  revalidatePath("/publishers/[slug]", "page");
  revalidatePath("/admin/handouts", "page");
  revalidatePath("/admin/handout-reviews", "page");
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

  const cover = readCoverImage(formData);
  if (!cover.ok) return fail(cover.error);

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

  /*
   * The cover goes up before the row is written: a failed upload then leaves
   * the catalogue untouched, and a failed write removes the file it had just
   * put there. Either way no row ends up pointing at a file that is not
   * there. Left `undefined`, Prisma leaves the column alone.
   */
  let coverUrl: string | undefined;
  if (cover.file) {
    try {
      coverUrl = await storeCover("books", cover.file);
    } catch {
      return fail("uploadFailed");
    }
  }

  let replaced: string | null = null;
  try {
    if (bookId) {
      if (coverUrl) {
        const current = await prisma.book.findUnique({
          where: { id: bookId },
          select: { coverUrl: true },
        });
        replaced = current?.coverUrl ?? null;
      }
      await prisma.book.update({ where: { id: bookId }, data: { ...data, coverUrl } });
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
          coverUrl,
          slug: slugify(titleAr, `book-${Date.now()}`),
          isbn: `TEMP-${Date.now()}`,
          coverType: "paperback",
          weightGrams: 0,
        },
      });
    }
  } catch {
    await discardCover(coverUrl);
    return fail("duplicate");
  }

  // Nothing refers to the cover this one replaced any more.
  await discardCover(replaced);

  revalidateCatalogue();
  revalidatePath("/admin/books", "page");
  return ok();
}

export async function deleteBook(bookId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const ordered = await prisma.orderItem.count({ where: { bookId } });
  if (ordered > 0) return fail("inUse");

  const deleted = await prisma.book.delete({
    where: { id: bookId },
    select: { coverUrl: true },
  });
  await discardCover(deleted.coverUrl);

  revalidateCatalogue();
  revalidatePath("/admin/books", "page");
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

  const cover = readCoverImage(formData);
  if (!cover.ok) return fail(cover.error);

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

  // Upload first, write second, tidy up whichever one lost — as in `saveBook`.
  let coverUrl: string | undefined;
  if (cover.file) {
    try {
      coverUrl = await storeCover("handouts", cover.file);
    } catch {
      return fail("uploadFailed");
    }
  }

  let replaced: string | null = null;
  try {
    if (handoutId) {
      if (coverUrl) {
        const current = await prisma.handout.findUnique({
          where: { id: handoutId },
          select: { coverUrl: true },
        });
        replaced = current?.coverUrl ?? null;
      }
      await prisma.handout.update({
        where: { id: handoutId },
        data: { ...data, coverUrl },
      });
    } else {
      await prisma.handout.create({
        data: {
          ...data,
          coverUrl,
          slug: slugify(titleAr, `handout-${Date.now()}`),
          isbn: `TEMP-${Date.now()}`,
          coverType: "paperback",
          weightGrams: 0,
        },
      });
    }
  } catch {
    await discardCover(coverUrl);
    return fail("duplicate");
  }

  await discardCover(replaced);

  revalidateHandouts();
  return ok();
}

export async function deleteHandout(handoutId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const ordered = await prisma.handoutOrderItem.count({ where: { handoutId } });
  if (ordered > 0) return fail("inUse");

  const deleted = await prisma.handout.delete({
    where: { id: handoutId },
    select: { coverUrl: true },
  });
  await discardCover(deleted.coverUrl);

  revalidateHandouts();
  return ok();
}

export async function setHandoutReviewStatus(
  reviewId: string,
  status: ReviewStatus,
): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const review = await prisma.handoutReview.findUnique({
    where: { id: reviewId },
    select: { handoutId: true },
  });
  if (!review) return fail("notFound");

  await prisma.$transaction(async (tx) => {
    await tx.handoutReview.update({ where: { id: reviewId }, data: { status } });
    await refreshHandoutRating(tx, review.handoutId);
  });

  revalidateHandouts();
  return ok();
}

/* ------------------------------------------------------------------ */
/* Categories and authors                                              */
/* ------------------------------------------------------------------ */

/**
 * A branch's place in the tree, read from the form: the parent it hangs under
 * (none for a top-level branch) and its position among its siblings.
 */
function readBranchPlacement(formData: FormData) {
  return {
    parentId: text(formData, "parentId") || null,
    sortOrder: number(formData, "sortOrder"),
  };
}

/**
 * A nested branch's slug carries its parent's, so "العلمي" under two grades
 * does not collide, and so the address says where the branch sits.
 */
function branchSlug(nameAr: string, parentSlug: string | null, fallback: string) {
  const own = slugify(nameAr, fallback);
  return parentSlug ? `${parentSlug}-${own}` : own;
}

export async function saveCategory(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const nameAr = text(formData, "nameAr");
  if (!nameAr) return fail("missingTitle");

  const categoryId = text(formData, "categoryId");
  const { parentId, sortOrder } = readBranchPlacement(formData);

  /* The parent must exist, and a branch cannot hang under itself or under
     anything below it — that would cut it out of the tree. */
  const parent = parentId ? await getCategoryById(parentId) : undefined;
  if (parentId && !parent) return fail("missingRelation");
  if (categoryId && parent) {
    const self = await getCategoryById(categoryId);
    if (self && isWithin(self, parent.id)) return fail("invalidParent");
  }

  /* The slug left the form; see the note in `saveBook` for why it is absent
     from the update payload rather than defaulted into it. */
  const data = {
    nameAr,
    descriptionAr: text(formData, "descriptionAr"),
    icon: text(formData, "icon") || "BookOpen",
    parentId,
    sortOrder,
  };

  try {
    if (categoryId) {
      await prisma.category.update({ where: { id: categoryId }, data });
    } else {
      await prisma.category.create({
        data: {
          ...data,
          slug: branchSlug(nameAr, parent?.slug ?? null, `category-${Date.now()}`),
        },
      });
    }
  } catch {
    return fail("duplicate");
  }

  revalidateCatalogue();
  revalidatePath("/admin/categories", "page");
  return ok();
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  /* The branches below go first, then their titles; a branch is never
     deleted out from under either. */
  const children = await prisma.category.count({ where: { parentId: categoryId } });
  if (children > 0) return fail("hasChildren");

  const books = await prisma.book.count({ where: { categoryId } });
  if (books > 0) return fail("inUse");

  /* A teacher's subject is a branch too; the row would only lose it (the key
     is SET NULL), but silently is not how the panel drops a relation. */
  const teachers = await prisma.author.count({ where: { subjectId: categoryId } });
  if (teachers > 0) return fail("inUse");

  await prisma.category.delete({ where: { id: categoryId } });

  revalidateCatalogue();
  revalidatePath("/admin/categories", "page");
  return ok();
}

/* The handouts' tree: `saveCategory` and `deleteCategory` over its own table. */

export async function saveHandoutCategory(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const nameAr = text(formData, "nameAr");
  if (!nameAr) return fail("missingTitle");

  const categoryId = text(formData, "categoryId");
  const { parentId, sortOrder } = readBranchPlacement(formData);

  const parent = parentId ? await getHandoutCategoryById(parentId) : undefined;
  if (parentId && !parent) return fail("missingRelation");
  if (categoryId && parent) {
    const self = await getHandoutCategoryById(categoryId);
    if (self && isWithin(self, parent.id)) return fail("invalidParent");
  }

  const data = {
    nameAr,
    descriptionAr: text(formData, "descriptionAr"),
    icon: text(formData, "icon") || "BookOpen",
    parentId,
    sortOrder,
  };

  try {
    if (categoryId) {
      await prisma.handoutCategory.update({ where: { id: categoryId }, data });
    } else {
      await prisma.handoutCategory.create({
        data: {
          ...data,
          slug: branchSlug(nameAr, parent?.slug ?? null, `handout-category-${Date.now()}`),
        },
      });
    }
  } catch {
    return fail("duplicate");
  }

  revalidateHandouts();
  revalidatePath("/admin/handout-categories", "page");
  return ok();
}

export async function deleteHandoutCategory(categoryId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const children = await prisma.handoutCategory.count({ where: { parentId: categoryId } });
  if (children > 0) return fail("hasChildren");

  const handouts = await prisma.handout.count({ where: { categoryId } });
  if (handouts > 0) return fail("inUse");

  await prisma.handoutCategory.delete({ where: { id: categoryId } });

  revalidateHandouts();
  revalidatePath("/admin/handout-categories", "page");
  return ok();
}

export async function saveAuthor(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const nameAr = text(formData, "nameAr");
  if (!nameAr) return fail("missingTitle");

  /* The subject is a branch of the category tree, or nothing. The form only
     offers branches that exist, so a stale id means the branch went while
     the form was open. */
  const subjectId = text(formData, "subjectId");
  if (subjectId && !(await getCategoryById(subjectId))) return fail("missingRelation");

  /* Country and slug left the form. `countryAr` is non-null with no schema
     default, so a create supplies an empty string; an update leaves whatever
     the row already holds. */
  const data = {
    nameAr,
    subjectId: subjectId || null,
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
  revalidatePath("/admin/authors", "page");
  return ok();
}

export async function deleteAuthor(authorId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const books = await prisma.book.count({ where: { authorId } });
  if (books > 0) return fail("inUse");

  await prisma.author.delete({ where: { id: authorId } });

  revalidateCatalogue();
  revalidatePath("/admin/authors", "page");
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
  revalidatePath("/admin/publishers", "page");
  return ok();
}

export async function deletePublisher(publisherId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const books = await prisma.book.count({ where: { publisherId } });
  if (books > 0) return fail("inUse");

  await prisma.publisher.delete({ where: { id: publisherId } });

  revalidateCatalogue();
  revalidatePath("/admin/publishers", "page");
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
      handoutItems: { select: { handoutId: true, quantity: true } },
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

    const handouts = await prisma.handout.findMany({
      where: { id: { in: order.handoutItems.map((item) => item.handoutId) } },
      select: { id: true, stock: true },
    });
    const handoutsOnShelf = new Map(handouts.map((handout) => [handout.id, handout.stock]));

    const handoutShort = order.handoutItems.some(
      (item) => (handoutsOnShelf.get(item.handoutId) ?? 0) < item.quantity,
    );
    if (handoutShort) return fail("outOfStock");
  }

  const stockMoves =
    reclaiming || releasing
      ? [
          ...order.items.map((item) =>
            prisma.book.update({
              where: { id: item.bookId },
              data: {
                stock: reclaiming
                  ? { decrement: item.quantity }
                  : { increment: item.quantity },
              },
            }),
          ),
          ...order.handoutItems.map((item) =>
            prisma.handout.update({
              where: { id: item.handoutId },
              data: {
                stock: reclaiming
                  ? { decrement: item.quantity }
                  : { increment: item.quantity },
              },
            }),
          ),
        ]
      : [];

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status } }),
    prisma.orderEvent.create({ data: { orderId, status } }),
    ...stockMoves,
  ]);

  if (stockMoves.length) {
    revalidateCatalogue();
    revalidateHandouts();
  }
  revalidatePath("/admin/orders", "page");
  revalidatePath("/account/orders", "page");
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
      handoutItems: { select: { handoutId: true, quantity: true } },
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
    ...(releasing
      ? order.handoutItems.map((item) =>
          prisma.handout.update({
            where: { id: item.handoutId },
            data: { stock: { increment: item.quantity } },
          }),
        )
      : []),
  ]);

  if (releasing) {
    revalidateCatalogue();
    revalidateHandouts();
  }
  revalidatePath("/admin/orders", "page");
  revalidatePath("/account/orders", "page");
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

  revalidatePath("/admin/reviews", "page");
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

  revalidatePath("/admin/customers", "page");
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

  revalidatePath("/admin/coupons", "page");
  return ok();
}

export async function deleteCoupon(couponId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const removed = await prisma.coupon.deleteMany({ where: { id: couponId } });
  if (!removed.count) return fail("notFound");

  revalidatePath("/admin/coupons", "page");
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

  revalidatePath("/admin/coupons", "page");
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

  revalidatePath("/admin/messages", "page");
  return ok();
}

export async function deleteContactMessage(messageId: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const removed = await prisma.contactMessage.deleteMany({ where: { id: messageId } });
  if (!removed.count) return fail("notFound");

  revalidatePath("/admin/messages", "page");
  return ok();
}

export async function removeSubscriber(email: string): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const removed = await prisma.newsletterSubscriber.deleteMany({ where: { email } });
  if (!removed.count) return fail("notFound");

  revalidatePath("/admin/messages", "page");
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

  revalidatePath("/admin/settings", "page");

  if (section === "shipping") {
    revalidatePath("/cart", "page");
    revalidatePath("/checkout", "page");
  }

  if (section === "payments") {
    revalidatePath("/checkout", "page");
  }

  if (section === "adminNotifications") {
    // The bell lives in the admin layout, so the page alone is not enough.
    revalidatePath("/admin", "layout");
  }

  if (section === "store") {
    // The name, tagline and contact lines are baked into the header, footer
    // and page titles of every prerendered storefront page.
    revalidatePath("/", "layout");
  }

  return ok();
}

/**
 * Shows or hides one section of the home page.
 *
 * Each switch is its own row in the settings store, and the value written is
 * the state the button asked for rather than the opposite of whatever is
 * stored: two admins pressing "hide" on the same row end up with it hidden,
 * not flipped back on by the second press.
 */
export async function setHomeSectionVisibility(
  section: string,
  visible: boolean,
): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");
  if (!isHomeSection(section)) return fail("unknownSection");

  const key = homeSectionKey(section);
  const value = String(visible);

  await prisma.storeSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  revalidatePath("/admin/settings", "page");
  // The home page is prerendered and otherwise waits out its revalidate window.
  revalidatePath("/", "page");

  return ok();
}

/**
 * Saves one home page section's copy and content from its edit page.
 *
 * Every string the form carries is a row keyed `home.<section>.<field>`. A
 * field left empty, or set back to the dictionary's own wording, deletes
 * its row rather than storing a copy of the default: the table then holds
 * only what the panel actually changed, and a string nobody rewrote follows
 * the dictionary if the dictionary is edited later. The picked books are
 * checked against the catalogue before anything is written, so the page
 * never stores an id it cannot draw.
 */
export async function saveHomeSection(formData: FormData): Promise<ActionResult> {
  if (!(await requireManager())) return fail("forbidden");

  const section = text(formData, "section");
  if (!isHomeSection(section)) return fail("unknownSection");

  const { home } = await getDictionary(defaultLocale);
  const rows: { key: string; value: string | null }[] = (
    HOME_TEXT_FIELDS[section] as readonly string[]
  ).map((field) => {
    const value = text(formData, field);
    return {
      key: homeTextKey(section, field),
      value: value && value !== homeTextDefault(home, section, field) ? value : null,
    };
  });

  if (section === "hero") {
    const hero = await readHeroForm(formData);
    if (!hero.ok) return hero;
    rows.push(...hero.rows);
  } else if (isHomeShelf(section)) {
    const shelf = await readShelfForm(formData, section);
    if (!shelf.ok) return shelf;
    rows.push(...shelf.rows);
  } else if (section === "promo") {
    const promo = readPromoForm(formData);
    if (!promo.ok) return promo;
    rows.push(...promo.rows);
  }

  await prisma.$transaction(
    rows.map((row) =>
      row.value === null
        ? prisma.storeSetting.deleteMany({ where: { key: row.key } })
        : prisma.storeSetting.upsert({
            where: { key: row.key },
            create: { key: row.key, value: row.value },
            update: { value: row.value },
          }),
    ),
  );

  revalidatePath("/admin/settings", "page");
  revalidatePath("/admin/settings/home/[section]", "page");
  // The home page is prerendered and otherwise waits out its revalidate window.
  revalidatePath("/", "page");

  return ok();
}

type SectionRows =
  | { ok: true; rows: { key: string; value: string | null }[] }
  | { ok: false; error: string };

/** The hero's picks and links, validated. */
async function readHeroForm(formData: FormData): Promise<SectionRows> {
  const primaryHref = text(formData, "primaryHref");
  const secondaryHref = text(formData, "secondaryHref");
  if ((primaryHref && !isSafeHref(primaryHref)) || (secondaryHref && !isSafeHref(secondaryHref))) {
    return { ok: false, error: "invalidLink" };
  }

  const featuredBookId = text(formData, "featuredBookId");
  // Repeated hidden inputs, in the order the picker shows them.
  const showcaseIds = [...new Set(idList(formData, "showcaseIds"))].slice(0, HERO_SHOWCASE_SIZE);

  const wanted = [...new Set([featuredBookId, ...showcaseIds].filter(Boolean))];
  if (wanted.length) {
    const found = await prisma.book.count({ where: { id: { in: wanted } } });
    if (found !== wanted.length) return { ok: false, error: "unknownBook" };
  }

  const link = (value: string, fallback: string) =>
    value && value !== fallback ? value : null;

  return {
    ok: true,
    rows: [
      { key: HERO_KEYS.featuredBook, value: featuredBookId || null },
      { key: HERO_KEYS.showcase, value: showcaseIds.length ? JSON.stringify(showcaseIds) : null },
      { key: HERO_KEYS.primaryHref, value: link(primaryHref, HERO_DEFAULT_LINKS.primaryHref) },
      { key: HERO_KEYS.secondaryHref, value: link(secondaryHref, HERO_DEFAULT_LINKS.secondaryHref) },
    ],
  };
}

/** The banner's link and ghosted figure, validated. */
function readPromoForm(formData: FormData): SectionRows {
  const href = text(formData, "href");
  if (href && !isSafeHref(href)) return { ok: false, error: "invalidLink" };

  // Bounded in the browser; cut, not refused, for a post that skipped it.
  const figure = text(formData, "figure").slice(0, PROMO_FIGURE_MAX);

  return {
    ok: true,
    rows: [
      { key: PROMO_KEYS.href, value: href && href !== PROMO_DEFAULTS.href ? href : null },
      { key: PROMO_KEYS.figure, value: figure && figure !== PROMO_DEFAULTS.figure ? figure : null },
    ],
  };
}

/** How many of the ids name a row of the shelf's kind. */
const countByKind: Record<ShelfKind, (ids: string[]) => Promise<number>> = {
  book: (ids) => prisma.book.count({ where: { id: { in: ids } } }),
  category: (ids) => prisma.category.count({ where: { id: { in: ids } } }),
  author: (ids) => prisma.author.count({ where: { id: { in: ids } } }),
  publisher: (ids) => prisma.publisher.count({ where: { id: { in: ids } } }),
};

/** The error each kind reports when a pick has been deleted since the page loaded. */
const missingByKind: Record<ShelfKind, string> = {
  book: "unknownBook",
  category: "unknownCategory",
  author: "unknownAuthor",
  publisher: "unknownPublisher",
};

/**
 * A shelf's mode, count and picks, validated. Every one of them is stored
 * only when it differs from the shelf's own rule, like the strings.
 */
async function readShelfForm(formData: FormData, shelf: HomeShelf): Promise<SectionRows> {
  const { kind, limit: fallback, max } = HOME_SHELVES[shelf];
  const keys = shelfKeys(shelf);

  const mode = text(formData, "mode") === "manual" ? "manual" : "auto";

  /* The field is bounded in the browser, so a count outside the range only
     arrives from a post that skipped it; it is brought back into range
     rather than refused, and an empty field means the shelf's own number —
     which for a shelf that shows everything is no number at all. */
  const typed = text(formData, "limit");
  const limit = typed
    ? Math.min(max, Math.max(1, Math.round(number(formData, "limit", fallback ?? max))))
    : fallback;

  const ids = [...new Set(idList(formData, `${kind}Ids`))].slice(0, max);
  if (ids.length && (await countByKind[kind](ids)) !== ids.length) {
    return { ok: false, error: missingByKind[kind] };
  }

  return {
    ok: true,
    rows: [
      { key: keys.mode, value: mode === "manual" ? mode : null },
      { key: keys.limit, value: limit === fallback ? null : String(limit) },
      { key: keys.ids, value: ids.length ? JSON.stringify(ids) : null },
    ],
  };
}

function idList(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * What the book pickers on the home page forms search through. Reachable
 * only by the manager: the catalogue is public, but this shape and ranking
 * exist for the panel and there is no reason to serve them to anyone else.
 */
export async function searchHomeBooks(
  term: string,
  exclude: string[],
): Promise<PickOption[]> {
  if (!(await requireManager())) return [];

  const [safeTerm, safeExclude] = pickerArguments(term, exclude);
  return searchBookPicks(safeTerm, safeExclude);
}

/** The category picker's counterpart, for the category tiles. */
export async function searchHomeCategories(
  term: string,
  exclude: string[],
): Promise<PickOption[]> {
  if (!(await requireManager())) return [];

  const [safeTerm, safeExclude] = pickerArguments(term, exclude);
  return searchCategoryPicks(safeTerm, safeExclude);
}

/** The author picker's counterpart, for the spotlight. */
export async function searchHomeAuthors(
  term: string,
  exclude: string[],
): Promise<PickOption[]> {
  if (!(await requireManager())) return [];

  const [safeTerm, safeExclude] = pickerArguments(term, exclude);
  const { home } = await getDictionary(defaultLocale);
  return searchAuthorPicks(safeTerm, home.authors.booksCount, safeExclude);
}

/** The publisher picker's counterpart, for the presses' shelves. */
export async function searchHomePublishers(
  term: string,
  exclude: string[],
): Promise<PickOption[]> {
  if (!(await requireManager())) return [];

  const [safeTerm, safeExclude] = pickerArguments(term, exclude);
  const { home, searchPage } = await getDictionary(defaultLocale);
  return searchPublisherPicks(
    safeTerm,
    { books: home.authors.booksCount, handouts: searchPage.handoutsCount },
    safeExclude,
  );
}

/** Picker arguments arrive as JSON from the browser, so their shape is checked, not assumed. */
function pickerArguments(term: unknown, exclude: unknown): [string, string[]] {
  return [
    typeof term === "string" ? term.trim().slice(0, 80) : "",
    Array.isArray(exclude)
      ? exclude.filter((id): id is string => typeof id === "string").slice(0, 64)
      : [],
  ];
}
