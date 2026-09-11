import { LifeBuoy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Accordion } from "@/components/ui/accordion";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.info.faq.title };
}

export default async function FaqPage() {
  const locale = defaultLocale;

  const dictionary = await getDictionary(locale);
  const page = dictionary.info.faq;

  return (
    <>
      <PageHeader
        title={page.title}
        subtitle={page.subtitle}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: "/" },
          { label: page.title },
        ]}
      />

      <Container className="py-8 lg:py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <Accordion items={page.items} />

          <Surface
            appearance="filled-alternative"
            className="flex flex-wrap items-center justify-between gap-4 p-5"
          >
            <div className="flex items-center gap-3">
              <LifeBuoy aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
              <p className="text-body-md text-on-surface">
                {dictionary.account.orderDetails.needHelp}
              </p>
            </div>
            <Link
              href={`/contact`}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              {dictionary.info.contact.title}
            </Link>
          </Surface>
        </div>
      </Container>
    </>
  );
}
