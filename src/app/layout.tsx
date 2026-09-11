import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { FluentShell } from "@/components/fluent/fluent-shell";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { ToastProvider } from "@/components/ui/toast";
import { getStoreIdentity } from "@/data";
import { defaultLocale, localeDirection } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

import "@/app/globals.css";

/**
 * Almarai — the store's only face.
 *
 * Every role points here: body, headings and figures alike. IBM Plex Sans
 * Arabic and its four weights were removed with it, so this is the single
 * webfont family the site downloads.
 *
 * Two weights, the 400 and the 700, and they are enough for the scale. The
 * body asks for 400 and gets it; `font-medium` (500) has nothing of its own
 * and resolves down to the Regular; `font-semibold` (600) resolves up to the
 * Bold. For a while only the Bold was here, and since a browser can embolden
 * but never lighten, every weight on the page rendered at 700 — the Regular
 * is what made the scale work.
 *
 * One file per weight, and it is the `.woff2`. `next/font/local` turns every
 * `src` entry into its own `@font-face`, so a `.woff` listed as a "fallback"
 * beside the `.woff2` is not a fallback at all: the browser sees two faces
 * with identical descriptors and downloads both. That doubled the font bytes
 * for a container every browser that runs this app can already read.
 *
 * The files are subset to the 528 code points the family maps, with the
 * unused `.notdef` duplicates dropped, and carry the OFL beside them.
 */
const almarai = localFont({
  src: [
    { path: "../../public/fonts/Almarai-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/Almarai-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-almarai",
  display: "swap",
});

/** Applies the stored theme before first paint to avoid a flash. */
const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export async function generateMetadata(): Promise<Metadata> {
  const [dictionary, identity] = await Promise.all([
    getDictionary(defaultLocale),
    getStoreIdentity(),
  ]);

  const name = identity.name[defaultLocale] || dictionary.brand.name;
  const tagline = identity.tagline[defaultLocale] || dictionary.brand.tagline;

  return {
    title: {
      default: `${name} — ${tagline}`,
      template: `%s | ${name}`,
    },
    description: dictionary.footer.about,
  };
}

/**
 * The only layout that renders `<html>`.
 *
 * It used to sit at `app/[locale]/layout.tsx`, with a forwarding stub here,
 * because the locale segment decided `lang` and `dir`. Arabic is the only
 * language and the segment is gone, so the two files collapsed into this one
 * and `lang` / `dir` are constants read from the config rather than the URL.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const dictionary = await getDictionary(defaultLocale);

  return (
    /*
     * The font variables belong on <html>, not <body>. `--font-sans` is
     * declared on :root and contains `var(--font-almarai)`; a nested
     * var() is resolved where the custom property is computed, so with the
     * fonts on <body> that reference was undefined at :root and the whole
     * font-family declaration was dropped as invalid.
     */
    <html
      lang={defaultLocale}
      dir={localeDirection[defaultLocale]}
      className={almarai.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <FluentShell dir={localeDirection[defaultLocale]}>
          <ToastProvider dismissLabel={dictionary.common.toast.dismiss}>
            {children}
          </ToastProvider>
        </FluentShell>
      </body>
    </html>
  );
}
