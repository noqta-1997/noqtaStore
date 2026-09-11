import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { AuthorForm } from "@/components/admin/author-form";
import { Panel } from "@/components/admin/panel";
import { RowActions } from "@/components/admin/row-actions";
import { deleteAuthor } from "@/app/actions/admin";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { authorTone, getAuthorInitials } from "@/components/author/author-card";
import { getAuthors } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import { readParam, type SearchParamsRecord } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface AdminAuthorsPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const admin = await getAdminDictionary(defaultLocale);

  return { title: `${admin.authors.title} — ${admin.brand.panel}` };
}

export default async function AdminAuthorsPage({
  searchParams,
}: AdminAuthorsPageProps) {
  const locale = defaultLocale;

  const term = readParam(await searchParams, "q");

  const [dictionary, admin, allAuthors] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getAuthors(),
  ]);

  const authors = term
    ? allAuthors.filter((author) =>
        `${author.name.ar} ${author.slug}`
          .toLowerCase()
          .includes(term.toLowerCase()),
      )
    : allAuthors;

  const t = admin.authors;

  return (
    <>
      <AdminPageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 min-w-0 lg:col-span-8">
          <TableToolbar
            action={`/admin/authors`}
            searchLabel={admin.common.search}
            searchPlaceholder={t.searchPlaceholder}
            defaultValue={term}
          />

          <Table minWidth="38rem">
            <Thead>
              <Tr>
                <Th>{t.table.author}</Th>
                <Th>{t.table.books}</Th>
                <Th className="text-end">{admin.common.actions}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {authors.map((author) => (
                <Tr key={author.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full font-display text-label-md font-bold",
                          authorTone(author.slug),
                        )}
                      >
                        {getAuthorInitials(author.name[locale])}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-on-surface">
                          {author.name[locale]}
                        </span>
                        <span className="block max-w-72 truncate text-label-md text-muted">
                          {author.bio[locale]}
                        </span>
                      </span>
                    </div>
                  </Td>
                  <Td data-numeric>
                    {formatNumber(author.booksCount, locale)}
                  </Td>
                  <Td>
                    <RowActions
                      viewHref={`/authors/${author.slug}`}
                      editHref={`/admin/authors/${author.id}/edit`}
                      itemName={author.name[locale]}
                      labels={{
                        view: admin.common.view,
                        edit: admin.common.edit,
                        delete: admin.common.delete,
                      }}
                      fallbackError={dictionary.common.toast.actionFailed}
                      errorMessages={{
                        inUse: dictionary.common.actionErrors.inUse,
                        forbidden: dictionary.common.actionErrors.forbidden,
                      }}
                      deleteAction={deleteAuthor.bind(null, author.id)}
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

          {!authors.length ? (
            <p className="rounded-xl border border-line bg-card p-8 text-center text-body-md text-muted">
              {admin.common.noResults}
            </p>
          ) : null}
        </div>

        <Panel title={t.form.title} className="min-w-0 lg:col-span-4">
          <AuthorForm admin={admin} dictionary={dictionary} />
        </Panel>
      </div>
    </>
  );
}
