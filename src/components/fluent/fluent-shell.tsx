"use client";

import {
  FluentProvider,
  RendererProvider,
  SSRProvider,
  createDOMRenderer,
  createDarkTheme,
  createLightTheme,
} from "@fluentui/react-components";
import { useServerInsertedHTML } from "next/navigation";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { useTheme } from "@/components/theme/use-theme";
import { noqtaBrand } from "@/theme/noqta-brand";
import {
  noqtaPaperDark,
  noqtaPaperLight,
  withPaper,
} from "@/theme/noqta-paper";

/**
 * The single client boundary for the Fluent islands.
 *
 * `children` arrive already rendered by the server and are passed straight
 * through, so nothing below this point is pulled into the client bundle. The
 * Phase 0 spike proved that: a `server-only` child rendered inside this shell
 * never appeared in any client chunk.
 *
 * The theme is built from the same two ramps the build-time token generator
 * uses — brand and paper — so the Tailwind layer and the Fluent islands
 * cannot drift apart. Without the paper half a dialog opened cold grey on a
 * cream page, and in dark mode it was grey #292929 against brown #211c16.
 */

const lightTheme = withPaper(createLightTheme(noqtaBrand), noqtaPaperLight);
const darkTheme = withPaper(createDarkTheme(noqtaBrand), noqtaPaperDark);

interface FluentShellProps {
  dir: "rtl" | "ltr";
  children: ReactNode;
}

export function FluentShell({ dir, children }: FluentShellProps) {
  const [renderer] = useState(() => createDOMRenderer());
  const flushed = useRef(new Set<string>());
  // Same store the toggle writes to, so the islands never lag the page.
  const theme = useTheme();

  /*
   * `useServerInsertedHTML` fires once per streaming flush. The pattern the
   * community snippets use re-emits every accumulated rule each time, which
   * shipped the whole sheet four times over — 103KB where 26KB was unique,
   * and CSS made up three quarters of the document. The `flushed` set sends
   * each rule exactly once.
   */
  useServerInsertedHTML(() => {
    const chunks: { bucket: string; css: string; attrs: Record<string, string> }[] = [];

    for (const sheet of Object.values(renderer.stylesheets)) {
      const fresh = sheet.cssRules().filter((rule) => {
        const key = `${sheet.bucketName}::${rule}`;
        if (flushed.current.has(key)) return false;
        flushed.current.add(key);
        return true;
      });

      if (fresh.length > 0) {
        chunks.push({
          bucket: sheet.bucketName,
          css: fresh.join(""),
          attrs: sheet.elementAttributes,
        });
      }
    }

    if (chunks.length === 0) return null;

    return (
      <>
        {chunks.map((chunk) => (
          <style
            key={chunk.bucket}
            {...chunk.attrs}
            dangerouslySetInnerHTML={{ __html: chunk.css }}
          />
        ))}
      </>
    );
  });

  const activeTheme = useMemo(
    () => (theme === "dark" ? darkTheme : lightTheme),
    [theme],
  );

  return (
    <RendererProvider renderer={renderer}>
      <SSRProvider>
        {/*
          `display: contents` keeps the provider out of the box tree, so the
          storefront's `min-h-dvh flex flex-col` shell behaves exactly as if it
          were not here. Custom properties still inherit through it — that
          follows the DOM tree, not the box tree.
        */}
        <FluentProvider
          dir={dir}
          theme={activeTheme}
          style={{ display: "contents" }}
        >
          {children}
        </FluentProvider>
      </SSRProvider>
    </RendererProvider>
  );
}
