import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { deletePublisher } from "@/app/actions/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { Panel } from "@/components/admin/panel";
import { PublisherForm } from "@/components/admin/publisher-form";
import { RowActions } from "@/components/admin/row-actions";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { publisherTone } from "@/components/publisher/publisher-card";
import { getPublishers } from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatNumber, formatYear } from "@/lib/format";
import { readParam, type SearchParamsRecord } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface AdminPublishersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: AdminPublishersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const admin = await getAdminDictionary(isLocale(locale) ? locale : "ar");

  return { title: `${admin.publishers.title} — ${admin.brand.panel}` };
}

export default async function AdminPublishersPage({
  params,
  searchParams,
}: AdminPublishersPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const term = readParam(await searchParams, "q");

  const [dictionary, admin, allPublishers] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getPublishers(),
  ]);

  const publishers = term
    ? allPublishers.filter((publisher) =>
        `${publisher.name.ar} ${publisher.name.en} ${publisher.slug}`
          .toLowerCase()
          .includes(term.toLowerCase()),
      )
    : allPublishers;

  const t = admin.publishers;

  return (
    <>
      <AdminPageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 space-y-4 lg:col-span-8">
          <TableToolbar
            action={`/${locale}/admin/publishers`}
            searchLabel={admin.common.search}
            searchPlaceholder={t.subtitle}
            defaultValue={term}
          />

          <Table minWidth="42rem">
            <Thead>
              <Tr>
                <Th>{t.table.name}</Th>
                <Th>{t.table.country}</Th>
                <Th>{t.table.founded}</Th>
                <Th>{t.table.books}</Th>
                <Th>{t.table.slug}</Th>
                <Th className="text-end">{admin.common.actions}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {publishers.map((publisher) => (
                <Tr key={publisher.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full",
                          publisherTone(publisher.slug),
                        )}
                      >
                        <Building2 className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-on-surface">
                          {publisher.name[locale]}
                        </span>
                        <span className="block max-w-72 truncate text-label-md text-muted">
                          {publisher.description[locale]}
                        </span>
                      </span>
                    </div>
                  </Td>
                  <Td className="text-on-surface-variant">
                    {publisher.country[locale] || "—"}
                  </Td>
                  <Td data-numeric>
                    {publisher.foundedYear
                      ? formatYear(publisher.foundedYear, locale)
                      : "—"}
                  </Td>
                  <Td data-numeric>
                    {formatNumber(publisher.booksCount, locale)}
                  </Td>
                  <Td>
                    <span className="text-label-md text-muted" dir="ltr">
                      {publisher.slug}
                    </span>
                  </Td>
                  <Td>
                    <RowActions
                      viewHref={`/${locale}/publishers/${publisher.slug}`}
                      editHref={`/${locale}/admin/publishers/${publisher.id}/edit`}
                      itemName={publisher.name[locale]}
                      labels={{
                        view: admin.common.view,
                        edit: admin.common.edit,
                        delete: admin.common.delete,
                      }}
                      fallbackError={dictionary.common.toast.actionFailed}
                      errorMessages={dictionary.common.actionErrors}
                      deleteAction={deletePublisher.bind(null, publisher.id)}
                      confirm={{
                        title: dictionary.common.confirm.deleteTitle,
                        description: dictionary.common.confirm.deleteDescription,
                        confirm: dictionary.common.confirm.confirm,
                        cancel: dictionary.common.confirm.cancel,
                        done: dictionary.common.toast.deleted,
                        trigger: admin.common.delete,
                      }}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>

        <Panel title={t.form.title} className="min-w-0 lg:col-span-4">
          <PublisherForm admin={admin} dictionary={dictionary} />
        </Panel>
      </div>
    </>
  );
}
