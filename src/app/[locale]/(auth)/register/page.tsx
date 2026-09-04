import { permanentRedirect } from "next/navigation";

import { defaultLocale, isLocale } from "@/i18n/config";

/**
 * There is no separate sign-up any more.
 *
 * Google creates the account on the first round trip and `getCurrentCustomer`
 * adopts the seeded customer that already carries the same address, so a
 * returning reader lands on their own history without anything being asked of
 * them. A second page could only have offered the same single button.
 *
 * The route survives as a redirect rather than a 404 because it was public,
 * and anything already pointing at it — a bookmark, a link in a message —
 * should still arrive somewhere useful.
 */
export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  permanentRedirect(`/${isLocale(locale) ? locale : defaultLocale}/login`);
}
