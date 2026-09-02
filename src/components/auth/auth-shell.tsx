import { BookMarked, BellRing, ListChecks } from "lucide-react";
import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import type { Dictionary } from "@/i18n/get-dictionary";

interface AuthShellProps {
  title: string;
  subtitle: string;
  dictionary: Dictionary;
  children: ReactNode;
}

/**
 * Split layout: the form on one side, the value proposition on the other.
 *
 * The aside used to be a full-strength brand fill carrying white text, which
 * on a cream page read as a slab of paint. It is the pale brand tint now —
 * the same one the offer card and the hero plate use — so the panel belongs
 * to the page and the ink stays ink.
 */
export function AuthShell({ title, subtitle, dictionary, children }: AuthShellProps) {
  const aside = dictionary.auth.aside;

  const points = [
    { icon: ListChecks, text: aside.point1 },
    { icon: BookMarked, text: aside.point2 },
    { icon: BellRing, text: aside.point3 },
  ];

  return (
    <Container className="py-10 lg:py-16">
      <div className="mx-auto grid max-w-5xl items-stretch overflow-hidden rounded-2xl border border-line bg-card elevation-md lg:grid-cols-2">
        <section className="bg-card p-6 sm:p-10">
          <div className="mx-auto max-w-sm space-y-6">
            <header className="space-y-2">
              <h1 className="text-headline-lg">{title}</h1>
              <p className="text-body-md text-on-surface-variant">{subtitle}</p>
            </header>
            {children}
          </div>
        </section>

        <section className="hidden flex-col justify-between gap-8 bg-primary-fixed p-10 text-on-surface lg:flex">
          <div className="space-y-3">
            <h2 className="text-headline-lg">{aside.title}</h2>
            <p className="max-w-sm text-body-md text-on-surface-variant">
              {aside.description}
            </p>
          </div>

          <ul className="space-y-3">
            {points.map((point) => (
              <li key={point.text} className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-primary">
                  <point.icon aria-hidden className="size-5" strokeWidth={1.75} />
                </span>
                <span className="text-body-md font-medium">{point.text}</span>
              </li>
            ))}
          </ul>

          <p aria-hidden className="watermark text-primary" data-mark={dictionary.brand.name} />
        </section>
      </div>
    </Container>
  );
}
