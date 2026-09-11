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
 * **It is Bold only.** `public/fonts/` holds one file, the 700, and a browser
 * cannot synthesise a lighter weight from a heavier one — it can only embolden.
 * So the 400 the body scale asks for, the 500 the labels ask for and the 600
 * the emphasis asks for all resolve to this one face and render at 700. The
 * type scale still varies size and spacing, but not weight: nothing on the
 * page is lighter than anything else.
 *
 * Dropping `Almarai-Regular.woff2` beside the Bold and adding it to `src`
 * below is the whole fix — the scale starts working again with no other
 * change, because the weights are already declared in globals.css.
 *
 * `.woff` sits beside the `.woff2` as the fallback for anything that cannot
 * read the newer container.
 */
const almarai = localFont({
  src: [
    { path: "../../public/fonts/Almarai-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/Almarai-Bold.woff", weight: "700", style: "normal" },
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
