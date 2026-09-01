import type { Metadata } from "next";
import {
  IBM_Plex_Sans_Arabic,
  JetBrains_Mono,
  Manrope,
  Work_Sans,
} from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { THEME_STORAGE_KEY } from "@/lib/theme";
import { ToastProvider } from "@/components/ui/toast";
import { getStoreIdentity } from "@/data";
import { isLocale, locales, localeDirection } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";

import "@/app/globals.css";

/** Display / headlines. */
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

/** Body copy. */
const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-work-sans",
  display: "swap",
});

/** Technical labels and figures. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

/** Arabic companion for all three families above. */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
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
    <html
      lang={locale}
      dir={localeDirection[locale]}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={cn(
          manrope.variable,
          workSans.variable,
          jetbrainsMono.variable,
          plexArabic.variable,
          "min-h-dvh antialiased",
        )}
      >
        <ToastProvider dismissLabel={dictionary.common.toast.dismiss}>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
