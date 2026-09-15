import { ArrowRight, ShoppingCart, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CartLineRow } from "@/components/commerce/cart-line-row";
import { OrderSummary } from "@/components/commerce/order-summary";
import { HandoutCartLineRow } from "@/components/handout/handout-cart-line-row";
import { Button, buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { List } from "@/components/ui/list-row";
import { PageHeader } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { getCart, getHandoutCart, getShippingRules } from "@/data";
import { applyCoupon, clearCoupon } from "@/app/actions/cart";
import { ActionForm } from "@/components/ui/action-form";
import { getAppliedCoupon } from "@/lib/coupon";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatNumber, formatPrice } from "@/lib/format";
import { isEmptyPreview, type SearchParamsRecord } from "@/lib/search-params";

interface CartPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.cart.title };
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const locale = defaultLocale;

  // The cart has two halves — books and handouts — shown as one list.
  const [dictionary, allLines, allHandoutLines, shippingRules] = await Promise.all([
    getDictionary(locale),
    getCart(),
    getHandoutCart(),
    getShippingRules(),
  ]);
  const previewEmpty = isEmptyPreview(await searchParams);
  const lines = previewEmpty ? [] : allLines;
  const handoutLines = previewEmpty ? [] : allHandoutLines;
  const hasLines = lines.length > 0 || handoutLines.length > 0;

  const t = dictionary.cart;
  const subtotal =
    lines.reduce((total, line) => total + line.lineTotal, 0) +
    handoutLines.reduce((total, line) => total + line.lineTotal, 0);
  const coupon = await getAppliedCoupon(subtotal);
  const discount = coupon?.discount ?? 0;
  const qualifiesForFreeShipping = subtotal >= shippingRules.freeThreshold;
  const shipping = qualifiesForFreeShipping ? 0 : shippingRules.standardCost;
  const remaining = Math.max(shippingRules.freeThreshold - subtotal, 0);
  const progress = Math.min(
    100,
    Math.round((subtotal / shippingRules.freeThreshold) * 100),
  );
  const itemsCount =
    lines.reduce((total, line) => total + line.quantity, 0) +
    handoutLines.reduce((total, line) => total + line.quantity, 0);

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={
          hasLines
            ? `${formatNumber(itemsCount, locale)} ${t.itemsCount}`
            : undefined
        }
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: "/" },
          { label: t.title },
        ]}
      />

      <Container className="py-8 lg:py-12">
        {hasLines ? (
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="min-w-0 space-y-4 lg:col-span-8">
              <Surface
                appearance="filled-alternative"
                className="flex items-center gap-3 p-4"
              >
                <Truck aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
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
              </Surface>

              <List>
                {lines.map((line) => (
                  <CartLineRow
                    key={line.bookId}
                    line={line}
                    locale={locale}
                    dictionary={dictionary.common}
                  />
                ))}
                {handoutLines.map((line) => (
                  <HandoutCartLineRow
                    key={line.handoutId}
                    line={line}
                    locale={locale}
                    dictionary={dictionary.common}
                  />
                ))}
              </List>

              <Link
                href={`/books`}
                className="inline-flex items-center gap-2 text-label-md text-on-surface underline-offset-4 hover:underline"
              >
                <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={1.75} />
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
                className="lg:sticky lg:top-35"
                footer={
                  <Link
                    href={`/checkout`}
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
            actionHref={`/books`}
          />
        )}
      </Container>
    </>
  );
}
