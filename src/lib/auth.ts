import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Customer as CustomerRow } from "@/generated/prisma/client";
import { isOwner } from "@/lib/owner";
import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { createClient } from "@/utils/supabase/server";

/** The Supabase user for the current request, or null when signed out. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * Maps a Supabase identity onto a Customer row.
 *
 * A reader who signs up with an email that already exists in the catalogue
 * adopts that record — orders, wishlist and reviews carry over rather than
 * starting a second, empty account for the same person.
 */
/**
 * The owner is an admin by definition and nobody else is, whatever the rows
 * happen to say. Enforced in both directions on every sign-in, so a stray
 * admin cannot outlive one visit.
 */
async function pinOwnerRole<T extends { id: string; email: string; role: string }>(
  customer: T,
): Promise<T> {
  const shouldBeAdmin = isOwner(customer.email);
  const isAdmin = customer.role === "admin";

  if (shouldBeAdmin === isAdmin) return customer;

  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: { role: shouldBeAdmin ? "admin" : "customer" },
  });

  return updated as unknown as T;
}

async function resolveCustomer(user: User) {
  const linked = await prisma.customer.findUnique({ where: { userId: user.id } });
  if (linked) return pinOwnerRole(linked);

  const email = user.email?.toLowerCase();

  if (email) {
    const existing = await prisma.customer.findUnique({ where: { email } });

    if (existing && !existing.userId) {
      return pinOwnerRole(
        await prisma.customer.update({
          where: { id: existing.id },
          data: { userId: user.id },
        }),
      );
    }

    if (existing) return pinOwnerRole(existing);
  }

  const metadata = user.user_metadata ?? {};

  const data = {
    userId: user.id,
    name: typeof metadata.full_name === "string" ? metadata.full_name : (email ?? ""),
    email: email ?? `${user.id}@placeholder.local`,
    phone: typeof metadata.phone === "string" ? metadata.phone : "",
  };

  try {
    // Atomic on userId, which is the constraint the common repeat hits.
    return pinOwnerRole(
      await prisma.customer.upsert({
        where: { userId: user.id },
        create: { ...data, role: isOwner(email) ? "admin" : "customer" },
        update: {},
      }),
    );
  } catch (error) {
    // A brand-new session is resolved by several server components at once —
    // the layout and the page both ask on the very first render. They all see
    // no row and all try to write one; the losers land here and read back the
    // row the winner just created.
    if (!isUniqueViolation(error)) throw error;

    const winner = await prisma.customer.findFirst({
      where: { OR: [{ userId: user.id }, ...(email ? [{ email }] : [])] },
    });

    if (!winner) throw error;

    // The email row may have been written without the link; claim it.
    if (winner.userId) return pinOwnerRole(winner);

    return pinOwnerRole(
      await prisma.customer.update({
        where: { id: winner.id },
        data: { userId: user.id },
      }),
    );
  }
}

/** The Customer row behind the current session, or null when signed out. */
export async function getCurrentCustomer() {
  const user = await getCurrentUser();
  return user ? resolveCustomer(user) : null;
}

/**
 * The customer behind an order or a review, or why the store will not take
 * one from this session: nobody is signed in, or the account is blocked.
 *
 * A block is a refusal at the till and at the review form, not a locked
 * door. `customers.status` used to be a label the panel set and nothing
 * read, so a blocked reader went on ordering; now the two things a reader
 * does that reach other people — buying and publishing — ask here first.
 * Browsing, the cart, the wishlist, the account pages and the order history
 * stay open: the row is still theirs, and so is what they bought.
 */
export async function getCustomerInGoodStanding(): Promise<
  | { ok: true; customer: CustomerRow }
  | { ok: false; error: "unauthenticated" | "blocked" }
> {
  const customer = await getCurrentCustomer();
  if (!customer) return { ok: false, error: "unauthenticated" };
  if (customer.status === "blocked") return { ok: false, error: "blocked" };
  return { ok: true, customer };
}

/**
 * For pages that only make sense when signed in. The proxy already redirects
 * anonymous visitors; this closes the gap if a route is ever reached directly.
 */
export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`/login`);

  return customer;
}

/** Admin pages additionally require the `admin` role. */
export async function requireAdmin() {
  const customer = await requireCustomer();
  if (customer.role !== "admin") redirect("/");

  return customer;
}
