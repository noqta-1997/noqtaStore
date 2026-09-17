import { randomInt } from "node:crypto";

import { STORE_TIME_ZONE } from "@/lib/constants";
import { isUniqueViolation, violatedConstraint } from "@/lib/prisma-errors";

/** YYYYMMDD in the store's own time zone; `en-CA` prints ISO order. */
const storeDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: STORE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The unique index on Order.reference, as Postgres names it. */
const REFERENCE_INDEX = "orders_reference_key";

/** How many references are tried before an order is given up on. */
export const REFERENCE_ATTEMPTS = 5;

/**
 * A reference a customer can read out over the phone: the day the order was
 * placed, on Baghdad's calendar, and six random digits. Nothing here makes
 * it unique — the index on the column does — so a collision is expected now
 * and then, and `withOrderReference` is where it is handled. Six digits give
 * a day 900,000 references; the four this started with gave 9,000, and on a
 * day with a hundred orders the odds of two drawing the same were better
 * than one in three.
 */
export function newOrderReference(now = new Date()): string {
  const day = storeDay.format(now).replace(/-/g, "");
  return `NQ-${day}-${randomInt(100000, 1000000)}`;
}

/** Whether the database refused a row because its reference is taken. */
export function isReferenceTaken(error: unknown): boolean {
  if (!isUniqueViolation(error)) return false;
  // The adapter names the index; treat an unnamed duplicate as this one too,
  // since it is the only unique column an order write can trip.
  const constraint = violatedConstraint(error);
  return constraint === null || constraint === REFERENCE_INDEX;
}

/**
 * Runs `write` with a fresh reference, and again with another when the
 * database reports that one taken.
 *
 * `write` is the whole order transaction, not just the insert: Postgres
 * abandons a transaction at its first failed statement, so the duplicate
 * cannot be caught inside it and the insert retried in place — the
 * transaction has to be started over. Every other failure comes straight
 * back to the caller on the first attempt, and so does the duplicate once
 * the attempts run out.
 */
export async function withOrderReference<T>(
  write: (reference: string) => Promise<T>,
  roll: () => string = newOrderReference,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await write(roll());
    } catch (error) {
      if (attempt >= REFERENCE_ATTEMPTS || !isReferenceTaken(error)) throw error;
    }
  }
}
