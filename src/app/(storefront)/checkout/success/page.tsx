import { CheckCircle2, PackageCheck, PhoneCall, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Surface, surfaceTitleStyles } from "@/components/ui/surface";
import { getOrderById, getOrders } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { requireCustomer } from "@/lib/auth";
import { formatDate, formatPrice, storeDateKey } from "@/lib/format";
import { readParam, type SearchParamsRecord } from "@/lib/search-params";

interface SuccessPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.orderSuccess.title };
}

export default async function OrderSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const locale = defaultLocale;

  // The confirmation shows a real order, so it needs the reader it belongs to.
  await requireCustomer();

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
        storeDateKey(new Date(new Date(order.createdAt).getTime() + 4 * 86_400_000)),
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
        <div className="space-y-4 rounded-xl border border-line bg-card p-8 text-center elevation-md">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success text-on-success">
            <CheckCircle2 aria-hidden className="size-8" strokeWidth={1.75} />
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
              href={`/account/orders/${order.id}`}
              className={buttonStyles({ size: "lg" })}
            >
              {t.trackOrder}
            </Link>
            <Link
              href={`/books`}
              className={buttonStyles({ variant: "secondary", size: "lg" })}
            >
              {t.continueShopping}
            </Link>
          </div>
        </div>

        <Surface as="section">
          <h2 className={surfaceTitleStyles()}>{t.nextSteps}</h2>
          <ol className="divide-y divide-line-divider">
            {steps.map((step, index) => (
              <li key={step.text} className="flex items-center gap-4 p-5">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-md font-semibold text-primary"
                  data-numeric
                >
                  {index + 1}
                </span>
                <step.icon aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
                <p className="text-body-md text-on-surface">{step.text}</p>
              </li>
            ))}
          </ol>
        </Surface>
      </div>
    </Container>
  );
}
