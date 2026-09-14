import { BadgeCheck, RotateCcw, Truck, Wallet, type LucideIcon } from "lucide-react";

import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/i18n/get-dictionary";
import { HOME_FEATURES, type HomeFeature } from "@/lib/home-sections";

interface FeaturesStripProps {
  dictionary: Dictionary["home"]["features"];
}

/** Each promise's icon. The panel rewrites the two lines beside it, not this. */
export const featureIcons: Record<HomeFeature, LucideIcon> = {
  shipping: Truck,
  payment: Wallet,
  authentic: BadgeCheck,
  returns: RotateCcw,
};

/**
 * The reference's services row: four promises, each an icon in a soft round
 * plate with two lines beside it, separated by space rather than by rules.
 */
export function FeaturesStrip({ dictionary }: FeaturesStripProps) {
  return (
    <section className="border-y border-line-divider bg-card py-10">
      <Container>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {HOME_FEATURES.map((feature) => {
            const Icon = featureIcons[feature];
            const { title, description } = dictionary[feature];

            return (
              <div key={feature} className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
                  <Icon aria-hidden className="size-5 text-primary" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-body-md font-semibold text-on-surface">{title}</p>
                  <p className="truncate text-body-md text-muted">{description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
