import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

interface PromoBannerProps {
  locale: Locale;
  dictionary: Dictionary["home"]["promo"];
}

/**
 * The reference's offer card is pale, not saturated: the discount is set as a
 * huge ghosted figure behind warm paper, and the only filled thing on it is
 * the button. That also fixes the contrast — the copy is ink on a tint now
 * rather than white on the brand fill.
 */
export function PromoBanner({ locale, dictionary }: PromoBannerProps) {
  return (
    <section className="py-14 lg:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-2xl bg-primary-fixed elevation-sm">
          <span
            aria-hidden
            className="pointer-events-none absolute -end-8 -bottom-20 font-display text-[12rem] leading-none font-bold text-primary opacity-15 select-none lg:text-[18rem]"
          >
            25%
          </span>

          <div className="relative grid gap-6 p-8 sm:p-12 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-8">
              <span className="inline-block rounded-full bg-card px-3 py-1 text-label-md font-semibold text-primary">
                {dictionary.eyebrow}
              </span>
              <h2 className="max-w-2xl text-headline-md sm:text-headline-lg">
                {dictionary.title}
              </h2>
              <p className="max-w-xl text-body-lg leading-relaxed text-on-surface-variant">
                {dictionary.description}
              </p>
            </div>

            <div className="lg:col-span-4 lg:justify-self-end">
              <Link
                href={`/${locale}/offers`}
                className={buttonStyles({
                  size: "lg",
                  className: "h-12 rounded-full",
                })}
              >
                {dictionary.cta}
                <ArrowRight aria-hidden className="size-4 rtl:rotate-180" strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
