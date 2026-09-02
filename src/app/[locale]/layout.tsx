import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { FluentShell } from "@/components/fluent/fluent-shell";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { ToastProvider } from "@/components/ui/toast";
import { getStoreIdentity } from "@/data";
import { isLocale, locales, localeDirection } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

import "@/app/globals.css";

/**
 * Two families, not four. Fluent carries its whole type ramp on one face and
 * separates the steps by size and weight, so the separate display and body
 * faces went; Plex Arabic covers both scripts and leads the stack, with
 * Fluent's Segoe stack behind it. That is two fewer webfonts on every page.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

/** Figures inside Arabic copy, via [data-numeric]. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

/** Applies the stored theme before first paint to avoid a flash. */
const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const [dictionary, identity] = await Promise.all([
    getDictionary(safeLocale),
    getStoreIdentity(),
  ]);

  const name = identity.name[safeLocale] || dictionary.brand.name;
  const tagline = identity.tagline[safeLocale] || dictionary.brand.tagline;

  return {
    title: {
      default: `${name} — ${tagline}`,
      template: `%s | ${name}`,
    },
    description: dictionary.footer.about,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    /*
     * The font variables belong on <html>, not <body>. `--font-sans` is
     * declared on :root and contains `var(--font-plex-arabic)`; a nested
     * var() is resolved where the custom property is computed, so with the
     * fonts on <body> that reference was undefined at :root and the whole
     * font-family declaration was dropped as invalid.
     */
    <html
      lang={locale}
      dir={localeDirection[locale]}
      className={cn(plexArabic.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className="min-h-dvh antialiased"
      >
        <FluentShell dir={localeDirection[locale]}>
          <ToastProvider dismissLabel={dictionary.common.toast.dismiss}>
            {children}
          </ToastProvider>
        </FluentShell>
      </body>
    </html>
  );
}
