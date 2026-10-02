import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import { addresses, customer } from "../src/data/account";
import { customers, salesSeries } from "../src/data/admin";
import { authors } from "../src/data/authors";
import { handoutCategories } from "../src/data/handout-categories";
import { handouts } from "../src/data/handouts";
import { slugify } from "../src/lib/slug";
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
  await prisma.handoutOrderItem.deleteMany();
  await prisma.handoutReview.deleteMany();
  await prisma.handoutWishlistItem.deleteMany();
  await prisma.handoutCartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.handout.deleteMany();
  await prisma.publisher.deleteMany();
  await prisma.author.deleteMany();
  await prisma.handoutCategory.deleteMany();
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
  /* The tree lists parents before children, and createMany keeps the order,
     so the parent rows exist by the time the foreign key looks for them. */
  await prisma.handoutCategory.createMany({
    data: handoutCategories.map((category) => ({
      id: category.id,
      slug: category.slug,
      nameAr: category.name.ar,
      descriptionAr: category.description.ar,
      icon: category.icon,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
    })),
  });

  await prisma.author.createMany({
    data: authors.map((author) => ({
      id: author.id,
      slug: author.slug,
      nameAr: author.name.ar,
      bioAr: author.bio.ar,
      avatarUrl: author.avatarUrl ?? null,
    })),
  });

  /*
   * Publishers come from the catalogue itself: one row per distinct name.
   *
   * The English name used to be both the map key and the source of the slug,
   * which is how the seeded publishers ended up with Latin slugs. With English
   * gone the Arabic name is the key, and the slug is made by the panel's own
   * `slugify` (src/lib/slug.ts), so a publisher created by hand in the panel
   * and one created here are shaped alike. Rows already in the database keep
   * the Latin slugs they were seeded with; this only decides what a fresh
   * seed produces.
   */
  const publisherNames = new Map<string, { ar: string }>();
  for (const handout of handouts) publisherNames.set(handout.publisher.ar, handout.publisher);

  const publisherIds = new Map<string, string>();
  let fallback = 0;
  for (const [nameAr, name] of publisherNames) {
    const slug = slugify(nameAr, "") || `publisher-${++fallback}`;

    const row = await prisma.publisher.create({
      data: { slug, nameAr: name.ar },
    });
    publisherIds.set(nameAr, row.id);
  }

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
      languageAr: handout.language.ar,
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
    categories: handoutCategories.length,
    authors: authors.length,
    publishers: publisherIds.size,
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

  return { customers: customers.length, addresses: addresses.length };
}

interface OrderSeed {
  id: string;
  reference: string;
  customerId: string;
  status: OrderStatus;
  createdAt: Date;
  items: {
    handoutId: string;
    quantity: number;
    unitPrice: number;
    titleAr: string;
    authorNameAr: string;
  }[];
  shippingCost: number;
  discount: number;
  paymentMethod: "cod" | "card" | "wallet";
  shippingMethod: "standard";
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
      handoutItems: { create: seed.items },
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
  // Historical orders so the dashboard charts have twelve real months to
  // aggregate instead of a hard-coded series.
  let counter = 0;
  for (const point of salesSeries) {
    const perMonth = Math.max(4, Math.round(point.orders / 12));

    for (let index = 0; index < perMonth; index += 1) {
      counter += 1;
      const day = 1 + Math.floor(random() * 27);
      const createdAt = new Date(`${point.month}-${String(day).padStart(2, "0")}T10:00:00Z`);
      const lineCount = 1 + Math.floor(random() * 3);
      const items = Array.from({ length: lineCount }, () => {
        const handout = pick(handouts);
        return {
          handoutId: handout.id,
          quantity: 1 + Math.floor(random() * 2),
          unitPrice: handout.price,
          titleAr: handout.title.ar,
          authorNameAr: authors.find((author) => author.id === handout.authorId)!.name.ar,
        };
      }).filter(
        (item, index_, all) =>
          all.findIndex((other) => other.handoutId === item.handoutId) === index_,
      );

      await insertOrder({
        id: `oh-${point.month}-${index}`,
        reference: `NQ-${point.month.replace("-", "")}-${1000 + counter}`,
        customerId: pick(customers).id,
        status: random() > 0.08 ? "delivered" : "cancelled",
        createdAt,
        items,
        shippingCost: 5000,
        discount: 0,
        paymentMethod: random() > 0.25 ? "cod" : "wallet",
        shippingMethod: "standard",
      });
    }
  }

  return { orders: await prisma.order.count() };
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
