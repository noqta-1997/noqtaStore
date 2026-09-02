import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { CategoryForm } from "@/components/admin/category-form";
import { Panel } from "@/components/admin/panel";
import { RowActions } from "@/components/admin/row-actions";
import { deleteCategory } from "@/app/actions/admin";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategories, getCategoryShares } from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";

interface AdminCategoriesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AdminCategoriesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const admin = await getAdminDictionary(isLocale(locale) ? locale : "ar");

  return { title: `${admin.categories.title} — ${admin.brand.panel}` };
}

export default async function AdminCategoriesPage({
  params,
}: AdminCategoriesPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [dictionary, admin, categories, shares] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getCategories(),
    getCategoryShares(),
  ]);

  const t = admin.categories;

  return (
    <>
      <AdminPageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <Table minWidth="42rem">
            <Thead>
              <Tr>
                <Th>{t.table.name}</Th>
                <Th>{t.table.slug}</Th>
                <Th>{t.table.books}</Th>
                <Th>{t.table.share}</Th>
                <Th className="text-end">{admin.common.actions}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {categories.map((category) => {
                const share =
                  shares.find((entry) => entry.categoryId === category.id)?.share ?? 0;

                return (
                  <Tr key={category.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-low text-primary">
                          <CategoryIcon name={category.icon} className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-on-surface">
                            {category.name[locale]}
                          </span>
                          <span className="block max-w-64 truncate text-label-sm text-muted">
                            {category.description[locale]}
                          </span>
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <span className="font-mono text-label-md text-muted" dir="ltr">
                        {category.slug}
                      </span>
                    </Td>
                    <Td className="font-mono" data-numeric>
                      {formatNumber(category.booksCount, locale)}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-20 border border-line bg-surface-low">
                          <span
                            className="block h-full bg-primary-container"
                            style={{ width: `${share * 2.6}%` }}
                          />
                        </span>
                        <span className="font-mono text-label-sm text-muted" data-numeric>
                          {share}%
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <RowActions
                        viewHref={`/${locale}/categories/${category.slug}`}
                        editHref={`/${locale}/admin/categories/${category.id}/edit`}
                        itemName={category.name[locale]}
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
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </div>

        <Panel title={t.form.title} className="min-w-0 lg:col-span-4">
          <CategoryForm admin={admin} dictionary={dictionary} />
        </Panel>
      </div>
    </>
  );
}
