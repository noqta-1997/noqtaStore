"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * The stretch of a navigation no skeleton can cover.
 *
 * A route's `loading.tsx` is shown once the router has the route's shell,
 * and until then the page the reader clicked away from stays exactly as it
 * was. In production that is the round trip for the shell — or, for the
 * slug pages, the lookup their layout makes before it lets the shell go —
 * and on a slow connection it is as long as the connection makes it. In
 * development it is the compile of a route the server has not built yet,
 * which can run to seconds with nothing on screen to say so. This is the
 * one signal that spans all of that: a line along the top of the viewport
 * from the click to the commit.
 *
 * The click is read from the document rather than from every `Link`: a
 * click that reaches `window` with its default prevented, on a same-origin
 * anchor, is one the router has taken (`next/link` and `MenuLink` prevent
 * exactly those and no others), and a submit that arrives the same way on
 * a GET form is `next/form` doing the same. Back and forward are read from
 * `popstate`. The end is the router's own URL changing, which is the moment
 * the new route — its skeleton or the page itself — is on screen. A click
 * whose destination is the URL already shown would never move that URL, so
 * it starts nothing; and should a navigation ever be dropped without a
 * commit, the line gives up on its own rather than run for good.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /* The URL a navigation set out from — pending lasts until the router's
     URL has moved on from it, so a commit ends the line with no bookkeeping. */
  const [startedOn, setStartedOn] = useState<string | null>(null);

  const committed = `${pathname}?${searchParams}`;
  const pending = startedOn !== null && startedOn === committed;

  /* For the listeners, which are bound once: the router's URL, and where the
     document is as the router last left it — read on commit, so a `popstate`
     can tell a page change from a hash change. */
  const current = useRef({ committed, shown: "" });
  useEffect(() => {
    current.current = { committed, shown: key(location) };
  }, [committed]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setStartedOn(null), GIVE_UP_AFTER);
    return () => window.clearTimeout(timer);
  }, [pending]);

  useEffect(() => {
    const begin = () => setStartedOn(current.current.committed);

    const start = (destination: URL) => {
      if (key(destination) === key(location)) return;
      begin();
    };

    const onClick = (event: MouseEvent) => {
      if (!event.defaultPrevented || isModified(event)) return;
      const anchor = closestAnchor(event.target);
      if (!anchor || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;
      const destination = new URL(anchor.href, location.href);
      if (destination.origin !== location.origin) return;
      start(destination);
    };

    const onSubmit = (event: SubmitEvent) => {
      if (!event.defaultPrevented) return;
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const destination = formDestination(form, event.submitter);
      if (destination) start(destination);
    };

    const onPopState = () => {
      if (key(location) !== current.current.shown) begin();
    };

    window.addEventListener("click", onClick);
    window.addEventListener("submit", onSubmit);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("submit", onSubmit);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  if (!pending) return null;

  return (
    <div aria-hidden className="navigation-progress">
      <span />
    </div>
  );
}

/** A navigation with no commit in this long was dropped somewhere. */
const GIVE_UP_AFTER = 30_000;

/** Path and query, which is what a navigation changes; the hash is not. */
function key(url: { pathname: string; search: string }) {
  return `${url.pathname}${url.search}`;
}

/** The clicks the browser keeps for itself: new tab, new window, download. */
function isModified(event: MouseEvent) {
  return (
    event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
  );
}

function closestAnchor(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const anchor = target.closest("a[href]");
  return anchor instanceof HTMLAnchorElement ? anchor : null;
}

/**
 * Where a GET form is going, worked out the way `next/form` works it out:
 * the action, with the fields folded into its query. Anything else — a
 * server action's POST, a client action's `javascript:` — is not a
 * navigation and returns nothing.
 */
function formDestination(form: HTMLFormElement, submitter: HTMLElement | null) {
  const method = submitter?.getAttribute("formmethod") ?? form.getAttribute("method") ?? "get";
  if (method.toLowerCase() !== "get") return null;

  const action = submitter?.getAttribute("formaction") ?? form.getAttribute("action");
  if (!action) return null;

  let destination: URL;
  try {
    destination = new URL(action, location.href);
  } catch {
    return null;
  }
  if (destination.origin !== location.origin) return null;

  destination.search = "";
  for (const [name, value] of new FormData(form)) {
    destination.searchParams.append(name, typeof value === "string" ? value : value.name);
  }
  return destination;
}
