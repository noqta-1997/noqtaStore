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

export function PromoBanner({ locale, dictionary }: PromoBannerProps) {
  return (
    <section className="py-12 lg:py-16">
      <Container>
        <div className="relative overflow-hidden border border-line bg-primary-container text-on-primary-container shadow-hard">
          <span
            aria-hidden
            className="pointer-events-none absolute -end-10 -bottom-16 font-mono text-[12rem] leading-none font-bold opacity-15 select-none lg:text-[18rem]"
          >
            25%
          </span>

          <div className="relative grid gap-6 p-6 sm:p-10 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-8">
              <span className="label-mono inline-block border border-line bg-card px-2 py-1 text-on-surface">
                {dictionary.eyebrow}
              </span>
              <h2 className="max-w-2xl text-headline-md text-on-primary-container sm:text-headline-lg">
                {dictionary.title}
              </h2>
              <p className="max-w-xl text-body-md leading-relaxed">
                {dictionary.description}
              </p>
            </div>

            <div className="lg:col-span-4 lg:justify-self-end">
              <Link
                href={`/${locale}/offers`}
                className={buttonStyles({
                  size: "lg",
                  className: "bg-card text-on-surface hover:bg-surface-low",
                })}
              >
                {dictionary.cta}
                <ArrowRight aria-hidden className="size-4 rtl:rotate-180" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
