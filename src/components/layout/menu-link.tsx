"use client";

import { MenuItemLink, type MenuItemLinkProps } from "@fluentui/react-components";
import { useRouter } from "next/navigation";
import { useEffect, type MouseEvent } from "react";

interface MenuLinkProps extends Omit<MenuItemLinkProps, "href"> {
  /** An in-app path. Anything else belongs in a plain `MenuItemLink`. */
  href: string;
}

/**
 * A menu entry that leads to a page, by way of the app's router.
 *
 * Fluent's `MenuItemLink` is an anchor and nothing more, so a click on one
 * was a document load: the whole store reloaded every time a reader picked
 * a stage from the catalogue menu or an entry from the account menu — the
 * header thrown away and rebuilt, the route's skeleton never seen, the
 * scroll position lost. The anchor stays, because a middle click, a
 * modified click and a screen reader all read it as the link it is; an
 * ordinary left click is taken from the browser and given to the router,
 * which is exactly what `next/link` does for its own anchors.
 *
 * The route is prefetched when the entry appears. A `Link` prefetches when
 * it scrolls into view, and a menu's items mount only while the popover is
 * open, so this is the same moment: the reader is looking at the choice.
 * Not in development, for the reason `Link` gives — a prefetch there means
 * compiling the route, and a menu of twenty entries would compile twenty.
 */
export function MenuLink({ href, onClick, children, ...props }: MenuLinkProps) {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    router.prefetch(href);
  }, [router, href]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    // The browser keeps the clicks it has its own meaning for.
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const { target } = event.currentTarget;
    if (target && target !== "_self") return;

    event.preventDefault();
    router.push(href);
  };

  return (
    <MenuItemLink href={href} onClick={handleClick} {...props}>
      {children}
    </MenuItemLink>
  );
}
