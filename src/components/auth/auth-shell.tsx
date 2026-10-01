import type { ReactNode } from "react";

import { AuthAside } from "@/components/auth/auth-aside";
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
 * The aside is a deep brand gradient inset inside the white card, carrying
 * nothing but the mark, centred. It is always the white silhouette rather than
 * `LogoMark`, whose light-theme navy would sink into the blue. The gradient is
 * built from the `Static` brand steps, which do not flip in dark mode, so the
 * panel reads the same in both themes.
 */
export function AuthShell({ title, subtitle, dictionary, children }: AuthShellProps) {
  return (
    <Container className="py-10 lg:py-16">
      <div className="mx-auto grid max-w-6xl items-stretch overflow-hidden rounded-2xl border border-line bg-card elevation-md lg:min-h-[640px] lg:grid-cols-[1fr_1.15fr] lg:p-3">
        <section className="flex items-center bg-card p-6 sm:p-10">
          <div className="mx-auto w-full max-w-sm space-y-8">
            <header className="space-y-2 text-center">
              <h1 className="text-display-md">{title}</h1>
              <p className="text-body-md text-on-surface-variant">{subtitle}</p>
            </header>
            {children}
          </div>
        </section>

        <AuthAside name={dictionary.brand.name} />
      </div>
    </Container>
  );
}
