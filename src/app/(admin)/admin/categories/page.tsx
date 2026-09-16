import { CornerDownLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { CategoryForm } from "@/components/admin/category-form";
import { Panel } from "@/components/admin/panel";
import { RowActions } from "@/components/admin/row-actions";
import { deleteCategory } from "@/app/actions/admin";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategories, getCategoryShares } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import { readParam, type SearchParamsRecord } from "@/lib/search-params";

interface AdminCategoriesPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const admin = await getAdminDictionary(defaultLocale);

  return { title: `${admin.categories.title} — ${admin.brand.panel}` };
}

/**
 * The tree as a table: every branch on its own row, indented by how deep it
 * sits, parents above children. A row's "add under" link reopens this page
 * with the branch pre-selected as the parent in the form beside the table.
 */
export default async function AdminCategoriesPage({
  searchParams,
}: AdminCategoriesPageProps) {
  const locale = defaultLocale;
  const parentId = readParam(await searchParams, "parent");

  const [dictionary, admin, categories, shares] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getCategories(),
    getCategoryShares("all"),
  ]);

  const t = admin.categories;
  const shareOf = new Map(shares.map((entry) => [entry.categoryId, entry.share]));

  return (
    <>
      <AdminPageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <Table minWidth="42rem">
            <Thead>
              <Tr>
                <Th>{t.table.name}</Th>
                <Th>{t.table.books}</Th>
                <Th>{t.table.share}</Th>
                <Th className="text-end">{admin.common.actions}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {categories.map((category) => {
                const share = shareOf.get(category.id) ?? 0;

                return (
                  <Tr key={category.id}>
                    <Td>
                      <div
                        className="flex items-center gap-3"
                        style={{ paddingInlineStart: `${category.depth * 1.75}rem` }}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                          <CategoryIcon name={category.icon} className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-on-surface">
                            {category.name[locale]}
                          </span>
                          <span className="block max-w-48 truncate text-label-md text-muted">
                            {category.description[locale]}
                          </span>
                        </span>
                      </div>
                    </Td>
                    <Td data-numeric>
                      {formatNumber(category.booksCount, locale)}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-16 border border-line bg-surface-low">
                          <span
                            className="block h-full bg-primary-container"
                            style={{ width: `${share * 2.6}%` }}
                          />
                        </span>
                        <span className="text-label-md text-muted" data-numeric>
                          {share}%
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/categories?parent=${category.id}#category-form`}
                          aria-label={t.addChild}
                          title={t.addChild}
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-on-surface transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-primary"
                        >
                          <CornerDownLeft
                            aria-hidden
                            className="size-4 rtl:-scale-x-100"
                            strokeWidth={1.75}
                          />
                        </Link>
                        <RowActions
                          viewHref={`/categories/${category.slug}`}
                          editHref={`/admin/categories/${category.id}/edit`}
                          itemName={category.name[locale]}
                          labels={{
                            view: admin.common.view,
                            edit: admin.common.edit,
                            delete: admin.common.delete,
                          }}
                          fallbackError={dictionary.common.toast.actionFailed}
                          errorMessages={{
                            inUse: dictionary.common.actionErrors.inUse,
                            hasChildren: dictionary.common.actionErrors.hasChildren,
                            forbidden: dictionary.common.actionErrors.forbidden,
                            notFound: dictionary.common.actionErrors.notFound,
                            deleteFailed: dictionary.common.actionErrors.deleteFailed,
                          }}
                          deleteAction={deleteCategory.bind(null, category.id)}
                          confirm={{
                            title: dictionary.common.confirm.deleteTitle,
                            description: dictionary.common.confirm.deleteDescription,
                            confirm: dictionary.common.confirm.confirm,
                            cancel: dictionary.common.confirm.cancel,
                            done: dictionary.common.toast.deleted,
                            trigger: admin.common.delete,
                          }}
                        />
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </div>

        {/* The anchor the "add under" links land on; a fresh key resets the form's parent. */}
        <div id="category-form" className="min-w-0 lg:col-span-4">
          <Panel title={t.form.title}>
            <CategoryForm
              key={parentId || "top"}
              admin={admin}
              dictionary={dictionary}
              categories={categories}
              defaultParentId={parentId || undefined}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
