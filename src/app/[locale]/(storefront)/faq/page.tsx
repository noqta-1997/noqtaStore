import { LifeBuoy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Accordion } from "@/components/ui/accordion";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

interface FaqPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FaqPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.info.faq.title };
}

export default async function FaqPage({ params }: FaqPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);
  const page = dictionary.info.faq;

  return (
    <>
      <PageHeader
        title={page.title}
        subtitle={page.subtitle}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: `/${locale}` },
          { label: page.title },
        ]}
      />

      <Container className="py-8 lg:py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <Accordion items={page.items} />

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-line bg-surface-low p-5">
            <div className="flex items-center gap-3">
              <LifeBuoy aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={2} />
              <p className="text-body-md text-on-surface">
                {dictionary.account.orderDetails.needHelp}
              </p>
            </div>
            <Link
              href={`/${locale}/contact`}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              {dictionary.info.contact.title}
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
