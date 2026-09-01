import { redirect } from "next/navigation";

import { getStoreSettings } from "@/data";
import { defaultLocale, isLocale } from "@/i18n/config";

/**
 * The bare domain sends readers to the store's default language, which the
 * settings screen owns. A build-time redirect in next.config could not follow
 * that setting without a rebuild.
 */
export default async function RootPage() {
  const settings = await getStoreSettings();
  const target = isLocale(settings.defaultLocale)
    ? settings.defaultLocale
    : defaultLocale;

  redirect(`/${target}`);
}
