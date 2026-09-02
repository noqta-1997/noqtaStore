import { Banknote, CreditCard, Store, Truck, Wallet, Zap } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookCover } from "@/components/book/book-cover";
import { CheckoutForm } from "@/components/commerce/checkout-form";
import { OrderSummary } from "@/components/commerce/order-summary";
import { buttonStyles } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { ValidatedField } from "@/components/ui/validated-field";
import { Input } from "@/components/ui/input";
import { RadioCard } from "@/components/ui/radio-card";
import { Select } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import { getCart, getDefaultPaymentMethod, getShippingRules } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireCustomer } from "@/lib/auth";
import { getAppliedCoupon } from "@/lib/coupon";
import { formatPrice } from "@/lib/format";
import { governorates } from "@/lib/constants";

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.checkout.title };
}

function SectionCard({
  title,
  index,
  children,
}: {
  title: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-card">
      <h2 className="flex items-center gap-3 border-b border-line px-5 py-4 text-headline-md">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-md font-semibold text-primary"
          data-numeric
        >
          {index}
        </span>
        {title}
      </h2>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  // Placing an order needs an account, so the page asks for one up front.
  await requireCustomer(locale);

  const [dictionary, lines, shippingRules, paymentDefault] = await Promise.all([
    getDictionary(locale),
    getCart(),
    getShippingRules(),
    getDefaultPaymentMethod(),
  ]);

  const t = dictionary.checkout;
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  const shipping =
    subtotal >= shippingRules.freeThreshold ? 0 : shippingRules.standardCost;
  const discount = (await getAppliedCoupon(subtotal))?.discount ?? 0;

  const shippingOptions = [
    {
      id: "standard",
      icon: <Truck aria-hidden className="size-5" strokeWidth={1.75} />,
      title: t.shippingOptions.standardTitle,
      note: t.shippingOptions.standardNote,
      price: shipping,
      defaultChecked: true,
    },
    {
      id: "express",
      icon: <Zap aria-hidden className="size-5" strokeWidth={1.75} />,
      title: t.shippingOptions.expressTitle,
      note: t.shippingOptions.expressNote,
      price: shippingRules.expressCost,
      defaultChecked: false,
    },
    ...(shippingRules.enablePickup ? [{
      id: "pickup",
      icon: <Store aria-hidden className="size-5" strokeWidth={1.75} />,
      title: t.shippingOptions.pickupTitle,
      note: t.shippingOptions.pickupNote,
      price: 0,
      defaultChecked: false,
    }] : []),
  ];

  const paymentOptions = [
    {
      id: "cod",
      icon: <Banknote aria-hidden className="size-5" strokeWidth={1.75} />,
      title: t.paymentOptions.codTitle,
      note: t.paymentOptions.codNote,
      defaultChecked: paymentDefault !== "wallet",
      disabled: false,
    },
    {
      id: "wallet",
      icon: <Wallet aria-hidden className="size-5" strokeWidth={1.75} />,
      title: t.paymentOptions.walletTitle,
      note: t.paymentOptions.walletNote,
      defaultChecked: paymentDefault === "wallet",
      disabled: false,
    },
    {
      id: "card",
      icon: <CreditCard aria-hidden className="size-5" strokeWidth={1.75} />,
      title: t.paymentOptions.cardTitle,
      note: t.paymentOptions.cardNote,
      defaultChecked: false,
      disabled: true,
    },
  ];

  return (
    <>
      <section className="border-b border-line-divider bg-surface-low">
        <Container className="space-y-5 py-8 lg:py-10">
          <h1 className="text-headline-lg">{t.title}</h1>
          <Stepper
            steps={[t.steps.address, t.steps.shipping, t.steps.payment]}
            current={0}
          />
        </Container>
      </section>

      <Container className="grid gap-6 py-8 lg:grid-cols-12 lg:gap-8 lg:py-12">
        <CheckoutForm
          locale={locale}
          className="min-w-0 space-y-6 lg:col-span-7 xl:col-span-8"
          messages={{
            placed: dictionary.common.toast.orderPlaced,
            emptyCart: dictionary.common.toast.emptyCart,
            missingAddress: dictionary.common.toast.missingAddress,
            stockChanged: dictionary.common.toast.stockChanged,
            signIn: dictionary.common.toast.signInRequired,
            failure: dictionary.common.toast.actionFailed,
          }}
        >
          <SectionCard title={t.addressSection} index={1}>
            <div className="grid gap-4 sm:grid-cols-2">
              <ValidatedField
                id="fullName"
                name="fullName"
                autoComplete="name"
                required
                label={t.fullName}
                messages={dictionary.common.validation}
              />
              <ValidatedField
                id="phone"
                name="phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                placeholder="+964 7XX XXX XXXX"
                autoComplete="tel"
                required
                label={t.phone}
                messages={dictionary.common.validation}
              />
              <Field
                label={t.altPhone}
                htmlFor="altPhone"
                optional={dictionary.common.optional}
              >
                <Input id="altPhone" name="altPhone" type="tel" dir="ltr" />
              </Field>
              <Field label={t.governorate} htmlFor="governorate">
                <Select id="governorate" name="governorate" defaultValue="" required>
                  <option value="" disabled>
                    {t.selectGovernorate}
                  </option>
                  {governorates.map((item) => (
                    <option key={item.en} value={item.en}>
                      {item[locale]}
                    </option>
                  ))}
                </Select>
              </Field>
              <ValidatedField
                id="city"
                name="city"
                autoComplete="address-level2"
                required
                label={t.city}
                messages={dictionary.common.validation}
                className="sm:col-span-2"
              />
              <ValidatedField
                id="addressLine"
                name="addressLine"
                required
                label={t.addressLine}
                messages={dictionary.common.validation}
                className="sm:col-span-2"
              />
              <Field
                label={t.notes}
                htmlFor="notes"
                optional={dictionary.common.optional}
                className="sm:col-span-2"
              >
                <Textarea id="notes" name="notes" rows={3} />
              </Field>
            </div>

            <Checkbox
              id="saveAddress"
              name="saveAddress"
              defaultChecked
              label={t.saveAddress}
            />
          </SectionCard>

          <SectionCard title={t.shippingSection} index={2}>
            <div className="space-y-3">
              {shippingOptions.map((option) => (
                <RadioCard
                  key={option.id}
                  id={`shipping-${option.id}`}
                  name="shippingMethod"
                  value={option.id}
                  defaultChecked={option.defaultChecked}
                  icon={option.icon}
                  title={option.title}
                  note={option.note}
                  trailing={
                    <span
                      className="shrink-0 text-label-md font-semibold text-on-surface"
                      data-numeric
                    >
                      {option.price === 0
                        ? dictionary.common.free
                        : formatPrice(option.price, locale)}
                    </span>
                  }
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard title={t.paymentSection} index={3}>
            <div className="space-y-3">
              {paymentOptions.map((option) => (
                <RadioCard
                  key={option.id}
                  id={`payment-${option.id}`}
                  name="paymentMethod"
                  value={option.id}
                  defaultChecked={option.defaultChecked}
                  disabled={option.disabled}
                  icon={option.icon}
                  title={option.title}
                  note={option.note}
                />
              ))}
            </div>
            <p className="text-label-sm text-muted">{t.termsNote}</p>
          </SectionCard>
        </CheckoutForm>

        <div className="min-w-0 lg:col-span-5 xl:col-span-4">
          <OrderSummary
            title={t.orderSummary}
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
              <button
                type="submit"
                form="checkout-form"
                className={buttonStyles({ size: "lg", fullWidth: true })}
              >
                {t.placeOrder}
              </button>
            }
          >
            <p className="label-mono mb-3 text-muted">{t.itemsInOrder}</p>
            <ul className="space-y-3">
              {lines.map((line) => (
                <li key={line.bookId} className="flex items-center gap-3">
                  <span className="w-10 shrink-0">
                    <BookCover
                      title={line.book.title[locale]}
                      author={line.book.author.name[locale]}
                      seed={line.book.slug}
                      src={line.book.coverUrl}
                      sizes="2.5rem"
                      className="border border-line"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label-md text-on-surface">
                      {line.book.title[locale]}
                    </span>
                    <span className="block text-label-sm text-muted" data-numeric>
                      × {line.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 text-label-md" data-numeric>
                    {formatPrice(line.lineTotal, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </OrderSummary>
        </div>
      </Container>
    </>
  );
}
