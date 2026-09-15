import type { ReactNode } from "react";

import { StorefrontFooter } from "@/components/layout/storefront-footer";
import { StorefrontHeader } from "@/components/layout/storefront-header";
import { getCategoryTree, getHandoutCategoryTree, getStoreIdentity } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = defaultLocale;

  /* Both trees, whole: the header hangs them under their catalogue links and
     the phone drawer lists them. */
  const [dictionary, categories, handoutCategories, identity] = await Promise.all([
    getDictionary(locale),
    getCategoryTree(),
    getHandoutCategoryTree(),
    getStoreIdentity(),
  ]);

  const brand = {
    name: identity.name[locale] || dictionary.brand.name,
    tagline: identity.tagline[locale] || dictionary.brand.tagline,
  };
  const contact = {
    address: identity.address || dictionary.footer.contact.address,
    phone: identity.phone || dictionary.footer.contact.phone,
    email: identity.email || dictionary.footer.contact.email,
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:border focus:border-line focus:bg-primary-container focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-primary-container"
      >
        {dictionary.common.skipToContent}
      </a>

      <StorefrontHeader
        locale={locale}
        dictionary={dictionary}
        categories={categories}
        handoutCategories={handoutCategories}
        brand={brand}
      />

      <main id="main" className="flex-1">
        {children}
      </main>

      <StorefrontFooter
        dictionary={dictionary}
        brand={brand}
        contact={contact}
      />
    </div>
  );
}
