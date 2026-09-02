import { ArrowRight, ShoppingCart, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CartLineRow } from "@/components/commerce/cart-line-row";
import { OrderSummary } from "@/components/commerce/order-summary";
import { Button, buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { getCart, getShippingRules } from "@/data";
import { applyCoupon, clearCoupon } from "@/app/actions/cart";
import { ActionForm } from "@/components/ui/action-form";
import { getAppliedCoupon } from "@/lib/coupon";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatNumber, formatPrice } from "@/lib/format";
import { isEmptyPreview, type SearchParamsRecord } from "@/lib/search-params";

interface CartPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.cart.title };
}

export default async function CartPage({ params, searchParams }: CartPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [dictionary, allLines, shippingRules] = await Promise.all([
    getDictionary(locale),
    getCart(),
    getShippingRules(),
  ]);
  const lines = isEmptyPreview(await searchParams) ? [] : allLines;

  const t = dictionary.cart;
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  const coupon = await getAppliedCoupon(subtotal);
  const discount = coupon?.discount ?? 0;
  const qualifiesForFreeShipping = subtotal >= shippingRules.freeThreshold;
  const shipping = qualifiesForFreeShipping ? 0 : shippingRules.standardCost;
  const remaining = Math.max(shippingRules.freeThreshold - subtotal, 0);
  const progress = Math.min(
    100,
    Math.round((subtotal / shippingRules.freeThreshold) * 100),
  );
  const itemsCount = lines.reduce((total, line) => total + line.quantity, 0);

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={
          lines.length
            ? `${formatNumber(itemsCount, locale)} ${t.itemsCount}`
            : undefined
        }
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: `/${locale}` },
          { label: t.title },
        ]}
      />

      <Container className="py-8 lg:py-12">
        {lines.length ? (
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="min-w-0 space-y-4 lg:col-span-8">
              <div className="flex items-center gap-3 rounded-md border border-line bg-surface-low p-4">
                <Truck aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={2} />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-label-md text-on-surface">
                    {qualifiesForFreeShipping
                      ? t.freeShippingReached
                      : `${t.freeShippingHint} (${formatPrice(remaining, locale)})`}
                  </p>
                  <span className="block h-2 w-full overflow-hidden rounded-sm bg-surface-low">
                    <span
                      className="block h-full bg-primary-container"
                      style={{ width: `${progress}%` }}
                    />
                  </span>
                </div>
              </div>

              <ul className="divide-y divide-line-divider rounded-md border border-line bg-card">
                {lines.map((line) => (
                  <CartLineRow
                    key={line.bookId}
                    line={line}
                    locale={locale}
                    dictionary={dictionary.common}
                  />
                ))}
              </ul>

              <Link
                href={`/${locale}/books`}
                className="inline-flex items-center gap-2 text-label-md text-on-surface underline-offset-4 hover:underline"
              >
                <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={2} />
                {t.continueShopping}
              </Link>
            </div>

            <div className="min-w-0 lg:col-span-4">
              <OrderSummary
                title={t.summary}
                locale={locale}
                dictionary={dictionary.common}
                totals={{
                  subtotal,
                  shipping,
                  discount,
                  total: subtotal + shipping - discount,
                }}
                className="lg:sticky lg:top-44"
                footer={
                  <Link
                    href={`/${locale}/checkout`}
                    className={buttonStyles({ size: "lg", fullWidth: true })}
                  >
                    {t.checkout}
                  </Link>
                }
              >
                {coupon ? (
                  <ActionForm
                    className="flex flex-wrap items-center justify-between gap-2"
                    action={clearCoupon}
                    successTitle={dictionary.common.toast.couponRemoved}
                    fallbackError={dictionary.common.toast.actionFailed}
                  >
                    <span className="min-w-0 space-y-1">
                      <span className="block text-label-sm text-muted">
                        {t.couponActive}
                      </span>
                      <span
                        className="label-mono block border border-line bg-primary-container px-2 py-1 text-on-primary-container"
                        dir="ltr"
                      >
                        {coupon.code}
                      </span>
                    </span>
                    <Button variant="subtle" type="submit" className="shrink-0">
                      {t.couponRemove}
                    </Button>
                  </ActionForm>
                ) : (
                  <ActionForm
                    className="space-y-2"
                    action={applyCoupon}
                    successTitle={dictionary.common.toast.couponApplied}
                    errorMessages={dictionary.common.actionErrors}
                    fallbackError={dictionary.common.toast.actionFailed}
                  >
                    <label
                      htmlFor="coupon"
                      className="block text-label-md text-on-surface"
                    >
                      {t.couponLabel}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="coupon"
                        name="coupon"
                        dir="ltr"
                        placeholder={t.couponPlaceholder}
                        className="min-w-0 flex-1"
                      />
                      <Button variant="secondary" type="submit" className="shrink-0">
                        {t.couponApply}
                      </Button>
                    </div>
                  </ActionForm>
                )}
              </OrderSummary>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={ShoppingCart}
            title={t.empty.title}
            description={t.empty.description}
            actionLabel={t.empty.action}
            actionHref={`/${locale}/books`}
          />
        )}
      </Container>
    </>
  );
}
