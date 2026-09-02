import { BadgeCheck, RotateCcw, Truck, Wallet } from "lucide-react";

import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/i18n/get-dictionary";

interface FeaturesStripProps {
  dictionary: Dictionary["home"]["features"];
}

/**
 * The reference's services row: four promises, each an icon in a soft round
 * plate with two lines beside it, separated by space rather than by rules.
 */
export function FeaturesStrip({ dictionary }: FeaturesStripProps) {
  const features = [
    { icon: Truck, ...dictionary.shipping },
    { icon: Wallet, ...dictionary.payment },
    { icon: BadgeCheck, ...dictionary.authentic },
    { icon: RotateCcw, ...dictionary.returns },
  ];

  return (
    <section className="border-y border-line-divider bg-card py-10">
      <Container>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
                <Icon aria-hidden className="size-5 text-primary" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-body-md font-semibold text-on-surface">{title}</p>
                <p className="truncate text-body-md text-muted">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
