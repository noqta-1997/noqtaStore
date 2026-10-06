import type {
  AddressModel as AddressRow,
  AuthorModel as AuthorRow,
  HandoutCategoryModel as HandoutCategoryRow,
  HandoutModel as HandoutRow,
  HandoutOrderItemModel as HandoutOrderItemRow,
  HandoutReviewModel as HandoutReviewRow,
  OrderEventModel as OrderEventRow,
  OrderModel as OrderRow,
  PublisherModel as PublisherRow,
  SubjectModel as SubjectRow,
} from "@/generated/prisma/models";
import type {
  Address,
  Author,
  HandoutCategory,
  HandoutReview,
  HandoutReviewWithStatus,
  HandoutWithRelations,
  Localized,
  Order,
  Publisher,
  Subject,
} from "@/types";
import { storeDateKey } from "@/lib/format";

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

export function toHandoutCategory(row: HandoutCategoryRow): HandoutCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: { ar: row.nameAr },
    description: { ar: row.descriptionAr },
    icon: row.icon,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    handoutsCount: 0,
  };
}

export function toHandoutCategoryWithCount(
  row: HandoutCategoryRow & { _count?: { handouts: number } },
): HandoutCategory {
  return { ...toHandoutCategory(row), handoutsCount: row._count?.handouts ?? 0 };
}

export function toAuthor(row: AuthorRow & { _count?: { handouts: number } }): Author {
  return {
    id: row.id,
    slug: row.slug,
    name: { ar: row.nameAr },
    bio: { ar: row.bioAr },
    handoutsCount: row._count?.handouts ?? 0,
    avatarUrl: row.avatarUrl ?? undefined,
  };
}

export function toPublisher(row: PublisherRow & { _count?: { handouts: number } }): Publisher {
  return {
    id: row.id,
    slug: row.slug,
    name: { ar: row.nameAr },
    description: { ar: row.descriptionAr },
    handoutsCount: row._count?.handouts ?? 0,
  };
}

export function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    slug: row.slug,
    name: { ar: row.nameAr },
    icon: row.icon,
  };
}

export type HandoutRowWithRelations = HandoutRow & {
  author: AuthorRow & { _count?: { handouts: number } };
  category: HandoutCategoryRow & { _count?: { handouts: number } };
  publisher: PublisherRow & { _count?: { handouts: number } };
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
    language: { ar: row.languageAr },
    description: { ar: row.descriptionAr },
    tags: row.tags,
    coverUrl: row.coverUrl ?? undefined,
    archived: row.archivedAt !== null,
    createdAt: storeDateKey(row.createdAt),
    author: toAuthor(row.author),
    category: toHandoutCategoryWithCount(row.category),
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

export function toHandoutReview(row: HandoutReviewRow): HandoutReview {
  return {
    id: row.id,
    handoutId: row.handoutId,
    authorName: "",
    rating: row.rating,
    title: mirror(row.title),
    body: mirror(row.body),
    createdAt: storeDateKey(row.createdAt),
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
  handoutItems: HandoutOrderItemRow[];
  timeline: OrderEventRow[];
};

export function toOrder(row: OrderRowWithRelations): Order {
  return {
    id: row.id,
    reference: row.reference,
    createdAt: storeDateKey(row.createdAt),
    status: row.status,
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
    notes: row.notes,
    timeline: row.timeline
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
      .map((event) => ({
        status: event.status,
        date: storeDateKey(event.occurredAt),
        done: event.occurredAt.getTime() <= Date.now(),
      })),
  };
}
