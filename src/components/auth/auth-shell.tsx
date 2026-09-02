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

/** Split layout: the form on one side, the value proposition on the other. */
export function AuthShell({ title, subtitle, dictionary, children }: AuthShellProps) {
  const aside = dictionary.auth.aside;

  const points = [
    { icon: ListChecks, text: aside.point1 },
    { icon: BookMarked, text: aside.point2 },
    { icon: BellRing, text: aside.point3 },
  ];

  return (
    <Container className="py-10 lg:py-16">
      <div className="mx-auto grid max-w-5xl items-stretch gap-px border border-line bg-outline-variant lg:grid-cols-2">
        <section className="bg-card p-6 sm:p-10">
          <div className="mx-auto max-w-sm space-y-6">
            <header className="space-y-2">
              <h1 className="text-headline-lg">{title}</h1>
              <p className="text-body-md text-on-surface-variant">{subtitle}</p>
            </header>
            {children}
          </div>
        </section>

        <section className="hidden flex-col justify-between gap-8 bg-primary-container p-10 text-on-primary-container lg:flex">
          <div className="space-y-3">
            <h2 className="text-headline-lg text-on-primary-container">
              {aside.title}
            </h2>
            <p className="max-w-sm text-body-md">{aside.description}</p>
          </div>

          <ul className="space-y-3">
            {points.map((point) => (
              <li key={point.text} className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-card text-primary">
                  <point.icon aria-hidden className="size-5" strokeWidth={2} />
                </span>
                <span className="text-body-md font-medium">{point.text}</span>
              </li>
            ))}
          </ul>

          <p aria-hidden className="watermark" data-mark={dictionary.brand.name} />
        </section>
      </div>
    </Container>
  );
}
