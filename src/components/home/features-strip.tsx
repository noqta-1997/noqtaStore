import { BadgeCheck, RotateCcw, Truck, Wallet } from "lucide-react";

import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/i18n/get-dictionary";

interface FeaturesStripProps {
  dictionary: Dictionary["home"]["features"];
}

export function FeaturesStrip({ dictionary }: FeaturesStripProps) {
  const features = [
    { icon: Truck, ...dictionary.shipping },
    { icon: Wallet, ...dictionary.payment },
    { icon: BadgeCheck, ...dictionary.authentic },
    { icon: RotateCcw, ...dictionary.returns },
  ];

  return (
    <section className="border-b border-line-divider bg-card">
      <Container>
        {/* gap-px over a stroke-coloured background draws the hairlines */}
        <div className="grid grid-cols-1 gap-px bg-outline-variant sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-center gap-3 bg-card py-5 sm:px-5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-line bg-surface-low">
                <Icon aria-hidden className="size-5 text-primary" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface">{title}</p>
                <p className="truncate text-sm text-muted">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
