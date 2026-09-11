import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/i18n/get-dictionary";
import { LogoMark } from "@/components/layout/logo-mark";

interface StorefrontFooterProps {
  dictionary: Dictionary;
  /** Overrides the shipped copy when the settings screen has been filled in. */
  brand: { name: string; tagline: string };
  contact: { address: string; phone: string; email: string };
}

/**
 * The reference closes on paper rather than on ink: the footer is the same
 * beige as the banded sections, with the wordmark in the accent and the
 * columns in ordinary body text. That is why nothing here reads `--anchor`
 * any more — the one band that stays dark in both themes is the announcement
 * rail at the top of the header.
 */
export function StorefrontFooter({
  dictionary,
  brand,
  contact,
}: StorefrontFooterProps) {
  const { footer } = dictionary;

  const columns = [
    {
      title: footer.shop.title,
      links: [
        { label: footer.shop.newArrivals, href: `/books?sort=newest` },
        { label: footer.shop.bestsellers, href: `/books?sort=popular` },
        { label: footer.shop.offers, href: `/offers` },
        { label: footer.shop.categories, href: `/categories` },
      ],
    },
    {
      title: footer.help.title,
      links: [
        { label: footer.help.shipping, href: `/shipping` },
        { label: footer.help.returns, href: `/returns` },
        { label: footer.help.faq, href: `/faq` },
        { label: footer.help.contact, href: `/contact` },
      ],
    },
    {
      title: footer.store.title,
      links: [
        { label: footer.store.about, href: `/about` },
        { label: footer.store.publishers, href: `/publishers` },
        { label: footer.store.authors, href: `/authors` },
        { label: footer.store.careers, href: `/careers` },
      ],
    },
  ];

  return (
    <footer className="mt-20 border-t border-line-divider bg-surface-low text-on-surface-variant">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="space-y-4 lg:col-span-4">
          <div className="flex items-center gap-2.5">
            <LogoMark size={36} />
            <span className="font-display text-xl font-bold text-primary">
              {brand.name}
            </span>
          </div>
          <p className="max-w-sm text-body-md leading-relaxed">{footer.about}</p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} className="lg:col-span-2" aria-label={column.title}>
            <h2 className="mb-4 text-label-md font-semibold tracking-wide text-on-surface">
              {column.title}
            </h2>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-md underline-offset-4 transition-colors hover:text-primary hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="lg:col-span-2">
          <h2 className="mb-4 text-label-md font-semibold tracking-wide text-on-surface">
            {footer.contact.title}
          </h2>
          <ul className="space-y-3 text-body-md">
            <li className="flex items-start gap-2">
              <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-primary" strokeWidth={1.75} />
              {contact.address}
            </li>
            <li className="flex items-start gap-2">
              <Phone aria-hidden className="mt-1 size-4 shrink-0 text-primary" strokeWidth={1.75} />
              <span dir="ltr" data-numeric>
                {contact.phone}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Mail aria-hidden className="mt-1 size-4 shrink-0 text-primary" strokeWidth={1.75} />
              <span dir="ltr">{contact.email}</span>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-line-divider">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-label-md">
            © <span data-numeric>{new Date().getFullYear()}</span> {brand.name}{" "}
            — {footer.rights}
          </p>
          <ul className="flex items-center gap-5">
            <li>
              <Link
                href={`/privacy`}
                className="text-label-md underline-offset-4 hover:text-primary hover:underline"
              >
                {footer.privacy}
              </Link>
            </li>
            <li>
              <Link
                href={`/terms`}
                className="text-label-md underline-offset-4 hover:text-primary hover:underline"
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
