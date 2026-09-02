import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

interface StorefrontFooterProps {
  locale: Locale;
  dictionary: Dictionary;
  /** Overrides the shipped copy when the settings screen has been filled in. */
  brand: { name: string; tagline: string };
  contact: { address: string; phone: string; email: string };
}

export function StorefrontFooter({
  locale,
  dictionary,
  brand,
  contact,
}: StorefrontFooterProps) {
  const { footer } = dictionary;

  const columns = [
    {
      title: footer.shop.title,
      links: [
        { label: footer.shop.newArrivals, href: `/${locale}/books?sort=newest` },
        { label: footer.shop.bestsellers, href: `/${locale}/books?sort=popular` },
        { label: footer.shop.offers, href: `/${locale}/offers` },
        { label: footer.shop.categories, href: `/${locale}/categories` },
      ],
    },
    {
      title: footer.help.title,
      links: [
        { label: footer.help.shipping, href: `/${locale}/shipping` },
        { label: footer.help.returns, href: `/${locale}/returns` },
        { label: footer.help.faq, href: `/${locale}/faq` },
        { label: footer.help.contact, href: `/${locale}/contact` },
      ],
    },
    {
      title: footer.store.title,
      links: [
        { label: footer.store.about, href: `/${locale}/about` },
        { label: footer.store.publishers, href: `/${locale}/publishers` },
        { label: footer.store.authors, href: `/${locale}/authors` },
        { label: footer.store.careers, href: `/${locale}/careers` },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-line-divider bg-anchor text-on-anchor-variant">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12 lg:py-16">
        <div className="space-y-4 lg:col-span-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center border border-on-anchor bg-primary-container">
              <span className="size-2.5 rounded-full bg-on-primary-container" />
            </span>
            <span className="font-display text-xl font-extrabold text-on-anchor">
              {brand.name}
            </span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed">{footer.about}</p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} className="lg:col-span-2" aria-label={column.title}>
            <h2 className="label-mono mb-4 text-on-anchor-brand">
              {column.title}
            </h2>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm underline-offset-4 transition-colors hover:text-on-anchor hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="lg:col-span-2">
          <h2 className="label-mono mb-4 text-on-anchor-brand">
            {footer.contact.title}
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
              {contact.address}
            </li>
            <li className="flex items-start gap-2">
              <Phone aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
              <span dir="ltr" data-numeric>
                {contact.phone}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Mail aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
              <span dir="ltr">{contact.email}</span>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-on-anchor/20">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-label-sm">
            © <span data-numeric>{new Date().getFullYear()}</span> {brand.name}{" "}
            — {footer.rights}
          </p>
          <ul className="flex items-center gap-5">
            <li>
              <Link
                href={`/${locale}/privacy`}
                className="text-label-sm underline-offset-4 hover:text-on-anchor hover:underline"
              >
                {footer.privacy}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/terms`}
                className="text-label-sm underline-offset-4 hover:text-on-anchor hover:underline"
              >
                {footer.terms}
              </Link>
            </li>
          </ul>
        </Container>
      </div>
    </footer>
  );
}
