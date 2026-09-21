import { getCurrentCustomer } from "@/lib/auth";

/**
 * A `next` parameter the store is willing to follow: a path on this site,
 * or nothing.
 *
 * The check used to be "starts with `/` and not with `//`", and that let
 * `/\evil.com` through: a browser reads a backslash after the first slash
 * as a second slash, so the redirect left the site. Control characters
 * were another way out (`/\t/evil` parses as `//evil`). Resolving the value
 * against a fixed origin the way the browser will, and keeping it only when
 * it stays on that origin, closes every spelling at once instead of the
 * ones that have been thought of.
 */
export function sameSitePath(requested: string | null | undefined): string | null {
  if (!requested || !requested.startsWith("/")) return null;

  let url: URL;
  try {
    url = new URL(requested, "http://noqta.invalid");
  } catch {
    return null;
  }

  if (url.origin !== "http://noqta.invalid") return null;

  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Where a reader belongs once they have a session.
 *
 * An explicit `next` wins — someone bounced off the cart should land back on
 * the cart. Otherwise a manager goes to the panel and everyone else to their
 * account, so signing in never drops the owner on a page they did not want.
 */
export async function landingPath(requestedNext?: string | null): Promise<string> {
  const next = sameSitePath(requestedNext);
  if (next) return next;

  const customer = await getCurrentCustomer();

  return customer?.role === "admin" ? `/admin` : `/account`;
}
