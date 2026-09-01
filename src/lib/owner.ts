/**
 * The one account that may hold the admin role.
 *
 * Deliberately a literal and not an environment variable: an override is a
 * way to point "the owner" somewhere else by accident, and the rule here is
 * meant to have no such door. Changing the owner is a one-line edit, made on
 * purpose, reviewed like any other change.
 *
 * The role is re-asserted on every sign-in, in both directions: this address
 * is promoted if the row says otherwise, and anyone else holding `admin` is
 * demoted. A stray admin — from a seed, a manual edit, a restored backup —
 * cannot survive a single sign-in.
 */
export const OWNER_EMAIL = "noqta26@gmail.com";

export function isOwner(email: string | null | undefined): boolean {
  if (!email) return false;

  return email.toLowerCase() === OWNER_EMAIL;
}
