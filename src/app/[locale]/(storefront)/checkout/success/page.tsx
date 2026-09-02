import { CheckCircle2, PackageCheck, PhoneCall, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getOrderById, getOrders } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireCustomer } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { readParam, type SearchParamsRecord } from "@/lib/search-params";

interface SuccessPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: SuccessPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.orderSuccess.title };
}

export default async function OrderSuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  // The confirmation shows a real order, so it needs the reader it belongs to.
  await requireCustomer(locale);

  const reference = readParam(await searchParams, "order");

  const [dictionary, order] = await Promise.all([
    getDictionary(locale),
    reference ? getOrderById(reference) : getOrders().then((all) => all[0]),
  ]);

  if (!order) {
    notFound();
  }

  const t = dictionary.orderSuccess;
  const total = order.total;

  const facts = [
    { label: t.orderNumber, value: order.reference, numeric: true },
    {
      label: t.estimatedDelivery,
      value: formatDate(
        new Date(new Date(order.createdAt).getTime() + 4 * 86_400_000)
          .toISOString()
          .slice(0, 10),
        locale,
      ),
    },
    {
      label: t.paymentMethod,
      value:
        order.paymentMethod === "wallet"
          ? dictionary.checkout.paymentOptions.walletTitle
          : order.paymentMethod === "card"
            ? dictionary.checkout.paymentOptions.cardTitle
            : dictionary.checkout.paymentOptions.codTitle,
    },
    { label: dictionary.common.total, value: formatPrice(total, locale), numeric: true },
  ];

  const steps = [
    { icon: PhoneCall, text: t.steps.confirm },
    { icon: PackageCheck, text: t.steps.pack },
    { icon: Truck, text: t.steps.deliver },
  ];

  return (
    <Container className="py-12 lg:py-20">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-4 rounded-md border border-line bg-card p-8 text-center elevation-md">
          <span className="mx-auto flex size-16 items-center justify-center border border-line bg-success text-on-success">
            <CheckCircle2 aria-hidden className="size-8" strokeWidth={2} />
          </span>
          <h1 className="text-headline-lg">{t.title}</h1>
          <p className="mx-auto max-w-md text-body-md text-on-surface-variant">
            {t.subtitle}
          </p>

          <dl className="grid gap-px border border-line bg-outline-variant text-start sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-card p-4">
                <dt className="label-mono text-muted">{fact.label}</dt>
                <dd
                  className="mt-1 text-body-md font-semibold text-on-surface"
                  {...(fact.numeric ? { "data-numeric": true } : {})}
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
            <Link
              href={`/${locale}/account/orders/${order.id}`}
              className={buttonStyles({ size: "lg" })}
            >
              {t.trackOrder}
            </Link>
            <Link
              href={`/${locale}/books`}
              className={buttonStyles({ variant: "secondary", size: "lg" })}
            >
              {t.continueShopping}
            </Link>
          </div>
        </div>

        <section className="rounded-md border border-line bg-card">
          <h2 className="border-b border-line px-5 py-4 text-headline-md">
            {t.nextSteps}
          </h2>
          <ol className="divide-y divide-line-divider">
            {steps.map((step, index) => (
              <li key={step.text} className="flex items-center gap-4 p-5">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-low font-mono text-label-md"
                  data-numeric
                >
                  {index + 1}
                </span>
                <step.icon aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={2} />
                <p className="text-body-md text-on-surface">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Container>
  );
}
