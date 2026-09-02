import { MapPin, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SetDefaultAddressButton } from "@/components/account/set-default-address-button";
import { deleteAddress } from "@/app/actions/account";
import { getCustomer } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { isEmptyPreview, type SearchParamsRecord } from "@/lib/search-params";

interface AddressesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: AddressesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.account.addresses.title };
}

export default async function AddressesPage({
  params,
  searchParams,
}: AddressesPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [dictionary, customer] = await Promise.all([
    getDictionary(locale),
    getCustomer(),
  ]);
  const addresses = isEmptyPreview(await searchParams) ? [] : customer.addresses;

  const t = dictionary.account.addresses;

  if (!addresses.length) {
    return (
      <EmptyState
        icon={MapPin}
        title={t.empty.title}
        description={t.empty.description}
        actionLabel={t.empty.action}
        actionHref={`/${locale}/account/addresses/new`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-headline-md">{t.title}</h2>
          <p className="text-body-md text-muted">{t.subtitle}</p>
        </div>

        <Link
          href={`/${locale}/account/addresses/new`}
          className={buttonStyles({ size: "md" })}
        >
          <Plus aria-hidden className="size-4" strokeWidth={1.75} />
          {t.addNew}
        </Link>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <li key={address.id} className="flex flex-col gap-3 rounded-xl border border-line bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin aria-hidden className="size-4 text-primary" strokeWidth={1.75} />
                <span className="font-display text-base font-bold">
                  {address.label[locale]}
                </span>
              </div>
              {address.isDefault ? <Badge tone="primary">{t.default}</Badge> : null}
            </div>

            <address className="space-y-1 text-body-md not-italic text-on-surface-variant">
              <span className="block font-semibold text-on-surface">
                {address.fullName}
              </span>
              <span className="block" dir="ltr" data-numeric>
                {address.phone}
              </span>
              <span className="block">
                {address.governorate[locale]}، {address.city[locale]}
              </span>
              <span className="block">{address.line[locale]}</span>
            </address>

            <div className="mt-auto flex items-center gap-2 border-t border-line-divider pt-3">
              <Link
                href={`/${locale}/account/addresses/${address.id}/edit`}
                aria-label={dictionary.common.edit}
                title={dictionary.common.edit}
                className="inline-flex size-10 items-center justify-center border border-transparent text-on-surface transition-colors hover:border-line hover:bg-state-hover"
              >
                <Pencil aria-hidden className="size-4" strokeWidth={1.75} />
              </Link>
              <ConfirmDialog
                action={deleteAddress.bind(null, address.id)}
                fallbackError={dictionary.common.toast.actionFailed}
                itemName={address.label[locale]}
                labels={{
                  title: dictionary.common.confirm.deleteTitle,
                  description: dictionary.common.confirm.deleteDescription,
                  confirm: dictionary.common.confirm.confirm,
                  cancel: dictionary.common.confirm.cancel,
                  done: dictionary.common.toast.deleted,
                  trigger: dictionary.common.remove,
                }}
              />
              {!address.isDefault ? (
                <SetDefaultAddressButton
                  addressId={address.id}
                  label={t.setDefault}
                  successTitle={dictionary.common.toast.saved}
                  failureMessage={dictionary.common.toast.actionFailed}
                />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
