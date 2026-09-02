import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Noto_Naskh_Arabic, Playfair_Display } from "next/font/google";
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

/** Running text, both scripts, every weight the ramp asks for. */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

/*
 * Headings are a serif, and no serif covers both scripts, so the display
 * stack is two faces that never meet: Playfair renders the Latin glyphs,
 * Noto Naskh Arabic the Arabic ones, and the browser resolves the fallback
 * per glyph. Only the two weights the headings actually use are fetched.
 *
 * The count of webfonts is unchanged — JetBrains Mono left with the last of
 * the monospace figures, which the design no longer has anywhere.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const naskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["500", "700"],
  variable: "--font-naskh-arabic",
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
      className={cn(
        plexArabic.variable,
        playfair.variable,
        naskhArabic.variable,
      )}
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
