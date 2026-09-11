import { getCurrentCustomer } from "@/lib/auth";

/**
 * Where a reader belongs once they have a session.
 *
 * An explicit `next` wins — someone bounced off the cart should land back on
 * the cart. Otherwise a manager goes to the panel and everyone else to their
 * account, so signing in never drops the owner on a page they did not want.
 */
export async function landingPath(requestedNext?: string | null): Promise<string> {
  // Same-site paths only; "//" is protocol-relative and would leave the site.
  if (
    requestedNext &&
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//")
  ) {
    return requestedNext;
  }

  const customer = await getCurrentCustomer();

  return customer?.role === "admin" ? `/admin` : `/account`;
}
