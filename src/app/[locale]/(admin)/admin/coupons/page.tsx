import { TicketPercent } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { deleteCoupon } from "@/app/actions/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponToggle } from "@/components/admin/coupon-toggle";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { Panel } from "@/components/admin/panel";
import { RowActions } from "@/components/admin/row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { getCoupons } from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AdminCouponsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AdminCouponsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const admin = await getAdminDictionary(isLocale(locale) ? locale : "ar");

  return { title: `${admin.coupons.title} — ${admin.brand.panel}` };
}

export default async function AdminCouponsPage({ params }: AdminCouponsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [dictionary, admin, coupons] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getCoupons(),
  ]);

  const t = admin.coupons;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <AdminPageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          {coupons.length ? (
            <Table minWidth="52rem">
              <Thead>
                <Tr>
                  <Th>{t.table.code}</Th>
                  <Th>{t.table.value}</Th>
                  <Th>{t.table.minSubtotal}</Th>
                  <Th>{t.table.usage}</Th>
                  <Th>{t.table.expiry}</Th>
                  <Th>{admin.common.status}</Th>
                  <Th className="text-end">{admin.common.actions}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {coupons.map((coupon) => {
                  const expired = Boolean(coupon.expiresAt) && coupon.expiresAt < today;
                  const exhausted =
                    coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;
                  const live = coupon.active && !expired && !exhausted;

                  const state = !coupon.active
                    ? admin.common.inactive
                    : expired
                      ? t.expired
                      : exhausted
                        ? t.exhausted
                        : admin.common.active;

                  return (
                    <Tr key={coupon.id}>
                      <Td>
                        <span
                          className="label-mono block font-semibold text-on-surface"
                          dir="ltr"
                        >
                          {coupon.code}
                        </span>
                        <span className="block text-label-sm text-muted">
                          {t.types[coupon.type]}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap font-mono" data-numeric>
                        {coupon.type === "percentage"
                          ? `${formatNumber(coupon.value, locale)}%`
                          : formatPrice(coupon.value, locale)}
                      </Td>
                      <Td className="whitespace-nowrap font-mono" data-numeric>
                        {coupon.minSubtotal
                          ? formatPrice(coupon.minSubtotal, locale)
                          : "—"}
                      </Td>
                      <Td className="whitespace-nowrap font-mono" data-numeric>
                        {formatNumber(coupon.usedCount, locale)}
                        {coupon.usageLimit === null
                          ? ` / ${t.unlimited}`
                          : ` / ${formatNumber(coupon.usageLimit, locale)}`}
                      </Td>
                      <Td className="whitespace-nowrap text-on-surface-variant" data-numeric>
                        {coupon.expiresAt
                          ? formatDate(coupon.expiresAt, locale)
                          : t.noExpiry}
                      </Td>
                      <Td>
                        <span
                          className={cn(
                            "label-mono inline-flex border px-2 py-1",
                            live
                              ? "border-line bg-success text-on-success"
                              : "border-line bg-surface-low text-on-surface-variant",
                          )}
                        >
                          {state}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1">
                          <CouponToggle
                            couponId={coupon.id}
                            active={coupon.active}
                            code={coupon.code}
                            errorMessages={dictionary.common.actionErrors}
                            labels={{
                              activate: t.activate,
                              deactivate: t.deactivate,
                              saved: dictionary.common.toast.saved,
                              failure: dictionary.common.toast.actionFailed,
                            }}
                          />
                          <RowActions
                            editHref={`/${locale}/admin/coupons/${coupon.id}/edit`}
                            itemName={coupon.code}
                            labels={{
                              view: admin.common.view,
                              edit: admin.common.edit,
                              delete: admin.common.delete,
                            }}
                            fallbackError={dictionary.common.toast.actionFailed}
                            errorMessages={dictionary.common.actionErrors}
                            deleteAction={deleteCoupon.bind(null, coupon.id)}
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
          ) : (
            <EmptyState
              icon={TicketPercent}
              title={t.empty.title}
              description={t.empty.description}
            />
          )}
        </div>

        <Panel title={t.form.title} className="min-w-0 lg:col-span-4">
          <CouponForm admin={admin} dictionary={dictionary} />
        </Panel>
      </div>
    </>
  );
}
