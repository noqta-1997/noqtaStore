import type {
  AddressModel as AddressRow,
  AuthorModel as AuthorRow,
  BookModel as BookRow,
  CategoryModel as CategoryRow,
  HandoutModel as HandoutRow,
  HandoutOrderItemModel as HandoutOrderItemRow,
  HandoutReviewModel as HandoutReviewRow,
  OrderEventModel as OrderEventRow,
  OrderItemModel as OrderItemRow,
  OrderModel as OrderRow,
  PublisherModel as PublisherRow,
  ReviewModel as ReviewRow,
} from "@/generated/prisma/models";
import type {
  Address,
  Author,
  BookWithRelations,
  Category,
  HandoutReview,
  HandoutReviewWithStatus,
  HandoutWithRelations,
  Localized,
  Order,
  Publisher,
  Review,
  ReviewWithStatus,
} from "@/types";

/**
 * Translates database rows into the shapes the UI already speaks, so the
 * 49 pages and 83 components did not have to change when the mock arrays
 * were replaced by Postgres.
 *
 * Customer-written text (addresses, reviews) is stored in one column — the
 * reader types one string. `mirror` used to copy it into both locales so the
 * bilingual UI could render it without a special case; with Arabic the only
 * locale it now wraps the string in the one-key shape `Localized` still has.
 */
function mirror(value: string): Localized {
  return { ar: value };
}

export function toCategory(row: CategoryRow): Category & { booksCount: number } {
  return {
    id: row.id,
    slug: row.slug,
    name: { ar: row.nameAr },
    description: { ar: row.descriptionAr },
    icon: row.icon,
    booksCount: 0,
  };
}

export function toCategoryWithCount(
  row: CategoryRow & { _count?: { books: number } },
): Category {
  return { ...toCategory(row), booksCount: row._count?.books ?? 0 };
}

export function toAuthor(
  row: AuthorRow & { _count?: { books: number } },
): Author {
  return {
    id: row.id,
    slug: row.slug,
    name: { ar: row.nameAr },
    country: { ar: row.countryAr },
    bio: { ar: row.bioAr },
    booksCount: row._count?.books ?? 0,
    avatarUrl: row.avatarUrl ?? undefined,
  };
}

export function toPublisher(
  row: PublisherRow & { _count?: { books: number } },
): Publisher {
  return {
    id: row.id,
    slug: row.slug,
    name: { ar: row.nameAr },
    country: { ar: row.countryAr },
    description: { ar: row.descriptionAr },
    booksCount: row._count?.books ?? 0,
    foundedYear: row.foundedYear ?? undefined,
  };
}

export type BookRowWithRelations = BookRow & {
  author: AuthorRow & { _count?: { books: number } };
  category: CategoryRow & { _count?: { books: number } };
  publisher: PublisherRow & { _count?: { books: number } };
};

export function toBook(row: BookRowWithRelations): BookWithRelations {
  return {
    id: row.id,
    slug: row.slug,
    title: { ar: row.titleAr },
    authorId: row.authorId,
    categoryId: row.categoryId,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    rating: row.rating,
    reviewsCount: row.reviewsCount,
    stock: row.stock,
    pages: row.pages,
    publisherId: row.publisherId,
    publishedYear: row.publishedYear,
    isbn: row.isbn,
    language: { ar: row.languageAr },
    coverType: row.coverType,
    weightGrams: row.weightGrams,
    description: { ar: row.descriptionAr },
    tags: row.tags,
    coverUrl: row.coverUrl ?? undefined,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    author: toAuthor(row.author),
    category: toCategoryWithCount(row.category),
    publisher: toPublisher(row.publisher),
  };
}

export type HandoutRowWithRelations = HandoutRow & {
  author: AuthorRow & { _count?: { books: number } };
  category: CategoryRow & { _count?: { books: number } };
  publisher: PublisherRow & { _count?: { books: number } };
};

export function toHandout(row: HandoutRowWithRelations): HandoutWithRelations {
  return {
    id: row.id,
    slug: row.slug,
    title: { ar: row.titleAr },
    authorId: row.authorId,
    categoryId: row.categoryId,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    rating: row.rating,
    reviewsCount: row.reviewsCount,
    stock: row.stock,
    pages: row.pages,
    publisherId: row.publisherId,
    publishedYear: row.publishedYear,
    isbn: row.isbn,
    language: { ar: row.languageAr },
    coverType: row.coverType,
    weightGrams: row.weightGrams,
    description: { ar: row.descriptionAr },
    tags: row.tags,
    coverUrl: row.coverUrl ?? undefined,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    author: toAuthor(row.author),
    category: toCategoryWithCount(row.category),
    publisher: toPublisher(row.publisher),
  };
}

export function toAddress(row: AddressRow): Address {
  return {
    id: row.id,
    label: mirror(row.label),
    fullName: row.fullName,
    phone: row.phone,
    governorate: mirror(row.governorate),
    city: mirror(row.city),
    line: mirror(row.line),
    isDefault: row.isDefault,
  };
}

export function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    bookId: row.bookId,
    authorName: "",
    rating: row.rating,
    title: mirror(row.title),
    body: mirror(row.body),
    createdAt: row.createdAt.toISOString().slice(0, 10),
  };
}

export function toReviewWithAuthor(
  row: ReviewRow & { customer: { name: string } },
): Review {
  return { ...toReview(row), authorName: row.customer.name };
}

export function toReviewWithStatus(
  row: ReviewRow & { customer: { name: string }; book: BookRow },
): ReviewWithStatus {
  return {
    ...toReviewWithAuthor(row),
    status: row.status,
    bookTitle: { ar: row.book.titleAr },
  };
}

export function toHandoutReview(row: HandoutReviewRow): HandoutReview {
  return {
    id: row.id,
    handoutId: row.handoutId,
    authorName: "",
    rating: row.rating,
    title: mirror(row.title),
    body: mirror(row.body),
    createdAt: row.createdAt.toISOString().slice(0, 10),
  };
}

export function toHandoutReviewWithAuthor(
  row: HandoutReviewRow & { customer: { name: string } },
): HandoutReview {
  return { ...toHandoutReview(row), authorName: row.customer.name };
}

export function toHandoutReviewWithStatus(
  row: HandoutReviewRow & { customer: { name: string }; handout: HandoutRow },
): HandoutReviewWithStatus {
  return {
    ...toHandoutReviewWithAuthor(row),
    status: row.status,
    handoutTitle: { ar: row.handout.titleAr },
  };
}

export type OrderRowWithRelations = OrderRow & {
  items: OrderItemRow[];
  handoutItems: HandoutOrderItemRow[];
  timeline: OrderEventRow[];
};

export function toOrder(row: OrderRowWithRelations): Order {
  return {
    id: row.id,
    reference: row.reference,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    status: row.status,
    items: row.items.map((item) => ({
      bookId: item.bookId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    handoutItems: row.handoutItems.map((item) => ({
      handoutId: item.handoutId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    subtotal: row.subtotal,
    shippingCost: row.shippingCost,
    discount: row.discount,
    total: row.total,
    paymentMethod: row.paymentMethod,
    shippingMethod: row.shippingMethod,
    address: {
      id: row.id,
      label: mirror(row.shippingCity),
      fullName: row.shippingName,
      phone: row.shippingPhone,
      governorate: mirror(row.shippingGovernorate),
      city: mirror(row.shippingCity),
      line: mirror(row.shippingLine),
      isDefault: false,
    },
    timeline: row.timeline
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
      .map((event) => ({
        status: event.status,
        date: event.occurredAt.toISOString().slice(0, 10),
        done: event.occurredAt.getTime() <= Date.now(),
      })),
  };
}
