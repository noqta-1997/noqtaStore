import type { Metadata } from "next";

import { InfoPage } from "@/components/layout/info-page";
import { getShippingRules } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatDeliveryTime, formatPrice } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.info.shipping.title };
}

/**
 * Figures come from the same rules the checkout charges, so the page cannot
 * promise a price the store has since changed. Standard delivery is the only
 * method the store sells.
 */
export default async function Page() {
  const locale = defaultLocale;

  const [dictionary, rules] = await Promise.all([
    getDictionary(locale),
    getShippingRules(),
  ]);
  const page = dictionary.info.shipping;
  const { delivery, cost } = page.sections;

  const sections = [
    {
      title: delivery.title,
      body: delivery.body.replace(
        "{days}",
        formatDeliveryTime(rules.estimatedDays, dictionary.common),
      ),
    },
    {
      title: cost.title,
      body: cost.body.replace("{cost}", formatPrice(rules.standardCost, locale)),
    },
  ];

  return (
    <InfoPage
      title={page.title}
      subtitle={page.subtitle}
      sections={sections}
      crumbsLabel={dictionary.common.menu}
      crumbs={[
        { label: dictionary.common.home, href: "/" },
        { label: page.title },
      ]}
    />
  );
}
