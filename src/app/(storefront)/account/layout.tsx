import type { ReactNode } from "react";

import { AccountNav } from "@/components/account/account-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { getCustomer } from "@/data";
import { requireCustomer } from "@/lib/auth";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatDate } from "@/lib/format";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = defaultLocale;

  await requireCustomer();

  const [dictionary, customer] = await Promise.all([
    getDictionary(locale),
    getCustomer(),
  ]);

  const t = dictionary.account;

  return (
    <>
      <section className="border-b border-line-divider bg-surface-low">
        <Container className="space-y-4 py-8">
          <Breadcrumb
            label={dictionary.common.menu}
            items={[
              { label: dictionary.common.home, href: "/" },
              { label: t.title },
            ]}
          />

          <div className="flex flex-wrap items-center gap-4">
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-container font-display text-headline-md font-bold text-on-primary-container"
            >
              {customer.name.slice(0, 1)}
            </span>
            <div>
              <h1 className="text-headline-lg">
                {t.greeting}، {customer.name}
              </h1>
              <p className="text-label-md text-muted">
                {t.profile.memberSince}{" "}
                <span data-numeric>{formatDate(customer.memberSince, locale)}</span>
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="grid gap-6 py-8 lg:grid-cols-12 lg:gap-8 lg:py-12">
        <aside className="min-w-0 lg:col-span-3">
          <div className="rounded-xl border border-line bg-card p-2 lg:sticky lg:top-35">
            <AccountNav labels={t.nav} />
          </div>
        </aside>

        <div className="min-w-0 lg:col-span-9">{children}</div>
      </Container>
    </>
  );
}
