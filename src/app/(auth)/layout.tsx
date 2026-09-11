import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Container } from "@/components/ui/container";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/**
 * Auth pages get their own minimal frame — no storefront header or
 * footer, so nothing competes with the form.
 */
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = defaultLocale;

  const dictionary = await getDictionary(locale);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="border-b border-line-divider bg-card">
        <Container className="flex h-18 items-center justify-between gap-4">
          <Logo name={dictionary.brand.name} />

          <div className="flex items-center gap-1">
            <ThemeToggle labels={dictionary.common.theme} className="size-9" />
            <Link
              href={"/"}
              className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-label-md text-on-surface transition-colors hover:border-line hover:bg-state-hover"
            >
              <ArrowRight
                aria-hidden
                className="size-4 rotate-180 rtl:rotate-0"
                strokeWidth={1.75}
              />
              {dictionary.common.backToHome}
            </Link>
          </div>
        </Container>
      </header>

      <main className="flex flex-1 items-center">{children}</main>
    </div>
  );
}
