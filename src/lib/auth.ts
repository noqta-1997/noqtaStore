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

/** The email a row carries when its account has none the store can use. */
function placeholderEmail(userId: string) {
  return `${userId}@placeholder.local`;
}

/**
 * The email the auth server holds for an account right now. A customer row
 * keeps a copy of it; this is the original the copy is checked against.
 * `auth.users` is outside Prisma's schema — the foreign key on `userId` was
 * written by hand for the same reason — so it is read with plain SQL.
 */
async function authEmailOf(userId: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ email: string | null }[]>`
    SELECT email FROM auth.users WHERE id = ${userId}::uuid
  `;
  return rows[0]?.email?.toLowerCase() ?? null;
}

/**
 * Brings a linked row's email up to date with its account's. When another
 * row already holds the new address (a seeded or guest row, say) the copy is
 * left as it was and the log says so: folding two rows into one is not
 * something a sign-in should do on its own.
 */
async function followAuthEmail<T extends { id: string; email: string }>(
  row: T,
  email: string | null,
): Promise<T> {
  if (!email || row.email === email) return row;

  try {
    const updated = await prisma.customer.update({
      where: { id: row.id },
      data: { email },
    });
    return updated as unknown as T;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    // Expected now and then, and handled: a line, not a stack, per request.
    console.warn(`[auth] customer ${row.id} keeps ${row.email}: ${email} is another row's`);
    return row;
  }
}

/**
 * Moves another account's row off an email that account no longer has.
 *
 * Auth emails are unique, so a row linked to account A and carrying the
 * email account B signs in with can only be A's copy gone stale — A changed
 * address and has not been back since. The row is brought up to date the way
 * A's own sign-in would bring it, and if A's current address is taken too it
 * is parked on a placeholder until then. Either way the email is free for B.
 */
async function releaseEmail(row: { id: string; userId: string; email: string }) {
  const current = await authEmailOf(row.userId);
  const parked = placeholderEmail(row.userId);
  const target = current && current !== row.email ? current : parked;

  try {
    await prisma.customer.update({ where: { id: row.id }, data: { email: target } });
  } catch (error) {
    if (!isUniqueViolation(error) || target === parked) throw error;
    console.warn(`[auth] customer ${row.id} parked: ${target} is another row's`);
    await prisma.customer.update({ where: { id: row.id }, data: { email: parked } });
  }
}

/**
 * Maps a Supabase identity onto a Customer row.
 *
 * The account id is the identity; the email is a copy of the account's,
 * refreshed on every sign-in. A reader who signs up with an email that
 * already exists in the catalogue, on a row no account has claimed, adopts
 * that record — orders, wishlist and reviews carry over rather than starting
 * a second, empty account for the same person. A row another account has
 * claimed is never handed over: it used to be, and a reader who signed up
 * with an address a previous account had since given up was shown that
 * account's orders and addresses as their own.
 */
async function resolveCustomer(user: User) {
  const email = user.email?.toLowerCase() ?? null;

  const linked = await prisma.customer.findUnique({ where: { userId: user.id } });
  if (linked) return pinOwnerRole(await followAuthEmail(linked, email));

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

    if (existing?.userId) {
      await releaseEmail({ id: existing.id, userId: existing.userId, email: existing.email });
    }
  }

  const metadata = user.user_metadata ?? {};

  const data = {
    userId: user.id,
    name: typeof metadata.full_name === "string" ? metadata.full_name : (email ?? ""),
    email: email ?? placeholderEmail(user.id),
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
    if (winner.userId === user.id) return pinOwnerRole(winner);

    // Another account's row on this email, written since the release above:
    // not this reader's to take. Reported rather than adopted.
    if (winner.userId) throw error;

    // The email row may have been written without the link; claim it.
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
