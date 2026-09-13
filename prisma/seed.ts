import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  addresses,
  cartLines,
  customer,
  customerReviews,
  wishlistBookIds,
} from "../src/data/account";
import { adminOrders, adminReviews, customers, salesSeries } from "../src/data/admin";
import { authors } from "../src/data/authors";
import { books } from "../src/data/books";
import { categories } from "../src/data/categories";
import { handouts } from "../src/data/handouts";
import { reviews } from "../src/data/reviews";
import { PrismaClient } from "../src/generated/prisma/client";
import type { OrderStatus } from "../src/types";

config({ path: ".env.local", quiet: true });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

/** Deterministic PRNG so repeated seeds produce the same catalogue history. */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = makeRandom(20260830);

function pick<T>(items: T[]): T {
  return items[Math.floor(random() * items.length)];
}

async function clear() {
  // Children first: the schema cascades, but explicit order keeps the log clear.
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.handoutOrderItem.deleteMany();
  await prisma.handoutReview.deleteMany();
  await prisma.handoutWishlistItem.deleteMany();
  await prisma.handoutCartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.book.deleteMany();
  await prisma.handout.deleteMany();
  await prisma.publisher.deleteMany();
  await prisma.author.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
}

/** Two live codes so the cart's discount path has something to exercise. */
async function seedCoupons() {
  await prisma.coupon.createMany({
    data: [
      { code: "NOQTA10", type: "percentage", value: 10, minSubtotal: 20000 },
      { code: "AHLAN5000", type: "fixed", value: 5000, minSubtotal: 30000 },
    ],
  });

  return { coupons: await prisma.coupon.count() };
}

async function seedCatalogue() {
  await prisma.category.createMany({
    data: categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      nameAr: category.name.ar,
      descriptionAr: category.description.ar,
      icon: category.icon,
    })),
  });

  await prisma.author.createMany({
    data: authors.map((author) => ({
      id: author.id,
      slug: author.slug,
      nameAr: author.name.ar,
      countryAr: author.country.ar,
      bioAr: author.bio.ar,
      avatarUrl: author.avatarUrl ?? null,
    })),
  });

  /*
   * Publishers come from the catalogue itself: one row per distinct name.
   *
   * The English name used to be both the map key and the source of the slug,
   * which is how the seeded publishers ended up with Latin slugs. With English
   * gone the Arabic name is the key, and the slug keeps Arabic letters — the
   * same character class `slugify` in app/actions/admin.ts uses, so a
   * publisher created by hand in the panel and one created here are shaped
   * alike. Rows already in the database keep the Latin slugs they were seeded
   * with; this only decides what a fresh seed produces.
   */
  const publisherNames = new Map<string, { ar: string }>();
  for (const book of books) publisherNames.set(book.publisher.ar, book.publisher);
  for (const handout of handouts) publisherNames.set(handout.publisher.ar, handout.publisher);

  const publisherIds = new Map<string, string>();
  let fallback = 0;
  for (const [nameAr, name] of publisherNames) {
    const slug =
      nameAr
        .toLowerCase()
        .replace(/[^a-z0-9ء-ي]+/g, "-")
        .replace(/^-+|-+$/g, "") || `publisher-${++fallback}`;

    const row = await prisma.publisher.create({
      data: { slug, nameAr: name.ar },
    });
    publisherIds.set(nameAr, row.id);
  }

  await prisma.book.createMany({
    data: books.map((book) => ({
      id: book.id,
      slug: book.slug,
      titleAr: book.title.ar,
      descriptionAr: book.description.ar,
      price: book.price,
      compareAtPrice: book.compareAtPrice ?? null,
      stock: book.stock,
      pages: book.pages,
      publisherId: publisherIds.get(book.publisher.ar)!,
      publishedYear: book.publishedYear,
      isbn: book.isbn,
      languageAr: book.language.ar,
      coverType: book.coverType,
      weightGrams: book.weightGrams,
      coverUrl: book.coverUrl ?? null,
      tags: book.tags,
      rating: book.rating,
      reviewsCount: book.reviewsCount,
      authorId: book.authorId,
      categoryId: book.categoryId,
      createdAt: new Date(book.createdAt),
    })),
  });

  await prisma.handout.createMany({
    data: handouts.map((handout) => ({
      id: handout.id,
      slug: handout.slug,
      titleAr: handout.title.ar,
      descriptionAr: handout.description.ar,
      price: handout.price,
      compareAtPrice: handout.compareAtPrice ?? null,
      stock: handout.stock,
      pages: handout.pages,
      publisherId: publisherIds.get(handout.publisher.ar)!,
      publishedYear: handout.publishedYear,
      isbn: handout.isbn,
      languageAr: handout.language.ar,
      coverType: handout.coverType,
      weightGrams: handout.weightGrams,
      coverUrl: handout.coverUrl ?? null,
      tags: handout.tags,
      rating: handout.rating,
      reviewsCount: handout.reviewsCount,
      authorId: handout.authorId,
      categoryId: handout.categoryId,
      createdAt: new Date(handout.createdAt),
    })),
  });

  return {
    categories: categories.length,
    authors: authors.length,
    publishers: publisherIds.size,
    books: books.length,
    handouts: handouts.length,
  };
}

async function seedCustomers() {
  await prisma.customer.createMany({
    data: customers.map((entry) => ({
      id: entry.id,
      name: entry.name,
      email: entry.email,
      phone: entry.phone,
      city: entry.city.ar,
      status: entry.status,
      // The seeded reader doubles as the store manager for review purposes.
      // Never seed an admin: the role belongs to the owner's real account,
      // which src/lib/owner.ts grants on sign-in.
      role: "customer",
      createdAt: new Date(entry.joinedAt),
      birthDate: entry.id === customer.id ? new Date(customer.birthDate) : null,
    })),
  });

  await prisma.address.createMany({
    data: addresses.map((address) => ({
      id: address.id,
      customerId: customer.id,
      label: address.label.ar,
      fullName: address.fullName,
      phone: address.phone,
      governorate: address.governorate.ar,
      city: address.city.ar,
      line: address.line.ar,
      isDefault: address.isDefault,
    })),
  });

  await prisma.wishlistItem.createMany({
    data: wishlistBookIds.map((bookId) => ({ customerId: customer.id, bookId })),
  });

  await prisma.cartItem.createMany({
    data: cartLines.map((line) => ({
      customerId: customer.id,
      bookId: line.bookId,
      quantity: line.quantity,
    })),
  });

  return { customers: customers.length, addresses: addresses.length };
}

interface OrderSeed {
  id: string;
  reference: string;
  customerId: string;
  status: OrderStatus;
  createdAt: Date;
  items: { bookId: string; quantity: number; unitPrice: number }[];
  shippingCost: number;
  discount: number;
  paymentMethod: "cod" | "card" | "wallet";
  shippingMethod: "standard" | "express" | "pickup";
}

const statusFlow: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

async function insertOrder(seed: OrderSeed) {
  const subtotal = seed.items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );
  const address = addresses[0];

  await prisma.order.create({
    data: {
      id: seed.id,
      reference: seed.reference,
      customerId: seed.customerId,
      status: seed.status,
      subtotal,
      shippingCost: seed.shippingCost,
      discount: seed.discount,
      total: subtotal + seed.shippingCost - seed.discount,
      paymentMethod: seed.paymentMethod,
      shippingMethod: seed.shippingMethod,
      shippingName: address.fullName,
      shippingPhone: address.phone,
      shippingGovernorate: address.governorate.ar,
      shippingCity: address.city.ar,
      shippingLine: address.line.ar,
      createdAt: seed.createdAt,
      items: { create: seed.items },
      timeline: {
        create:
          seed.status === "cancelled"
            ? [
                { status: "pending", occurredAt: seed.createdAt },
                { status: "cancelled", occurredAt: seed.createdAt },
              ]
            : statusFlow
                .slice(0, statusFlow.indexOf(seed.status) + 1)
                .map((status, index) => ({
                  status,
                  occurredAt: new Date(
                    seed.createdAt.getTime() + index * 86_400_000,
                  ),
                })),
      },
    },
  });
}

async function seedOrders() {
  // 1. The twelve hand-written orders keep the reference numbers used across
  //    the admin screens stable.
  for (const order of adminOrders) {
    await insertOrder({
      id: order.id,
      reference: order.reference,
      customerId: order.customerId,
      status: order.status,
      createdAt: new Date(order.createdAt),
      items: order.items,
      shippingCost: order.shippingCost,
      discount: order.discount,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
    });
  }

  // 2. Historical orders so the dashboard charts have twelve real months
  //    to aggregate instead of a hard-coded series.
  let counter = 0;
  for (const point of salesSeries) {
    const perMonth = Math.max(4, Math.round(point.orders / 12));

    for (let index = 0; index < perMonth; index += 1) {
      counter += 1;
      const day = 1 + Math.floor(random() * 27);
      const createdAt = new Date(`${point.month}-${String(day).padStart(2, "0")}T10:00:00Z`);
      const lineCount = 1 + Math.floor(random() * 3);
      const items = Array.from({ length: lineCount }, () => {
        const book = pick(books);
        return {
          bookId: book.id,
          quantity: 1 + Math.floor(random() * 2),
          unitPrice: book.price,
        };
      }).filter(
        (item, index_, all) =>
          all.findIndex((other) => other.bookId === item.bookId) === index_,
      );

      await insertOrder({
        id: `oh-${point.month}-${index}`,
        reference: `NQ-${point.month.replace("-", "")}-${1000 + counter}`,
        customerId: pick(customers).id,
        status: random() > 0.08 ? "delivered" : "cancelled",
        createdAt,
        items,
        shippingCost: random() > 0.5 ? 0 : 5000,
        discount: 0,
        paymentMethod: random() > 0.25 ? "cod" : "wallet",
        shippingMethod: random() > 0.85 ? "express" : "standard",
      });
    }
  }

  return { orders: await prisma.order.count() };
}

async function seedReviews() {
  const pool = [
    ...reviews.map((review) => ({
      bookId: review.bookId,
      rating: review.rating,
      title: review.title.ar,
      body: review.body.ar,
      createdAt: review.createdAt,
      status: "published" as const,
    })),
    ...adminReviews.map((review) => ({
      bookId: review.bookId,
      rating: review.rating,
      title: review.title.ar,
      body: review.body.ar,
      createdAt: review.createdAt,
      status: review.status,
    })),
    ...customerReviews.map((review) => ({
      bookId: review.bookId,
      rating: review.rating,
      title: review.title.ar,
      body: review.body.ar,
      createdAt: review.createdAt,
      status: review.status,
    })),
  ];

  // One review per (book, customer): walk the customer list until a free slot
  // is found, otherwise drop the row rather than violate the constraint.
  const taken = new Set<string>();
  let created = 0;

  for (const entry of pool) {
    const owner = customers.find((c) => !taken.has(`${entry.bookId}:${c.id}`));
    if (!owner) continue;

    taken.add(`${entry.bookId}:${owner.id}`);
    await prisma.review.create({
      data: {
        bookId: entry.bookId,
        customerId: owner.id,
        rating: entry.rating,
        title: entry.title,
        body: entry.body,
        status: entry.status,
        createdAt: new Date(entry.createdAt),
      },
    });
    created += 1;
  }

  return { reviews: created };
}

async function main() {
  console.log("Clearing existing rows…");
  await clear();

  const catalogue = await seedCatalogue();
  console.log("Catalogue:", catalogue);

  const people = await seedCustomers();
  console.log("Customers:", people);

  const orderCounts = await seedOrders();
  console.log("Orders:", orderCounts);

  const reviewCounts = await seedReviews();
  console.log("Reviews:", reviewCounts);

  const coupons = await seedCoupons();
  console.log("Coupons:", coupons);

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
