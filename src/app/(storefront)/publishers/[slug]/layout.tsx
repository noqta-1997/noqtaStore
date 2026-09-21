import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { getPublisherBySlug } from "@/data";
import { readSlug } from "@/lib/slug";

/**
 * Decides "no such publisher" before a byte of the page is sent.
 *
 * `notFound()` only produces a 404 response while the response has not
 * started; once a loading boundary has streamed the shell the status is
 * already 200, and the not-found page arrives inside a document that says
 * it succeeded — to a reader that is fine, to a search engine it is a page
 * worth indexing. The page under this layout sits inside `loading.tsx`, so
 * its own `notFound()` is too late. A layout renders outside that boundary,
 * and its verdict is in before the shell is flushed.
 *
 * The lookup is the same one the page and its metadata make; `getXBySlug`
 * is memoised per request, so the row is read once.
 */
export default async function PublisherLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}) {
  const slug = readSlug((await params).slug);
  if (!(await getPublisherBySlug(slug))) notFound();

  return children;
}
