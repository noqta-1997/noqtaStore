"use client";

import { Popover, PopoverSurface } from "@fluentui/react-components";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type MouseEvent,
} from "react";

import type { CatalogueMenu as CatalogueMenuModel } from "@/lib/category-menu";
import { cn } from "@/lib/utils";

interface CatalogueMenuProps {
  menu: CatalogueMenuModel;
  /** The classes the plain nav links wear, so the trigger reads as one of them. */
  linkClassName: string;
}

/** How long the panel outlives the pointer, so crossing the gap below the link does not close it. */
const LEAVE_DELAY = 160;

const hoverQuery = "(hover: hover)";

function subscribeToHover(onChange: () => void) {
  const query = window.matchMedia(hoverQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Whether the pointer can hover; assumed so on the server, where the panel is closed anyway. */
function useCanHover() {
  return useSyncExternalStore(
    subscribeToHover,
    () => window.matchMedia(hoverQuery).matches,
    () => true,
  );
}

/**
 * A nav link with the catalogue's tree hanging under it.
 *
 * The link is still a link — "الكتب المدرسية" goes to the listing as it always
 * did — and the panel is what a pointer finds on the way there: it opens on
 * hover and on keyboard focus, closes when either leaves, and is rendered in
 * DOM order so Tab walks from the link into its columns and out the far side.
 * On a screen with no hover the first tap opens the panel instead and the
 * second one follows the link.
 *
 * Fluent's Popover positions the surface, styles it like every other floating
 * layer in the app, and closes it on Escape and on an outside click; it is
 * given the link as its target rather than a trigger, because a trigger's
 * click would toggle the panel instead of leaving.
 *
 * The header row has no width to spare, so there is no chevron: the open
 * state is drawn on the link itself.
 */
export function CatalogueMenu({ menu, linkClassName }: CatalogueMenuProps) {
  const [target, setTarget] = useState<HTMLAnchorElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const canHover = useCanHover();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<number | undefined>(undefined);
  /* Escape hands focus back to the link; that focus must not reopen the panel. */
  const skipFocusOpen = useRef(false);
  /* Without hover, a tap on the link opens the panel and the next one follows
     the link. Fluent counts a press on the link as an outside click and closes
     the panel before the click arrives, so what the panel was at pointer-down
     is remembered here. */
  const pressedWhileOpen = useRef(false);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  const cancelLeave = () => window.clearTimeout(leaveTimer.current);

  const open = () => {
    cancelLeave();
    setIsOpen(true);
  };

  const close = () => {
    cancelLeave();
    setIsOpen(false);
  };

  const closeSoon = () => {
    cancelLeave();
    leaveTimer.current = window.setTimeout(() => setIsOpen(false), LEAVE_DELAY);
  };

  /* Focus leaving the link and the panel together closes the panel; focus
     moving between them keeps it. */
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) close();
  };

  const onLinkFocus = () => {
    if (skipFocusOpen.current) {
      skipFocusOpen.current = false;
      return;
    }
    open();
  };

  const onLinkPointerDown = () => {
    pressedWhileOpen.current = isOpen;
  };

  const onLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!canHover && !pressedWhileOpen.current) {
      event.preventDefault();
      open();
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={canHover ? open : undefined}
      onMouseLeave={canHover ? closeSoon : undefined}
      onBlur={onBlur}
    >
      <Link
        ref={setTarget}
        href={menu.href}
        aria-expanded={isOpen}
        onFocus={onLinkFocus}
        onPointerDown={onLinkPointerDown}
        onClick={onLinkClick}
        className={cn(linkClassName, isOpen && "bg-state-hover text-on-surface")}
      >
        {menu.label}
      </Link>

      <Popover
        open={isOpen}
        onOpenChange={(event, data) => {
          if (data.open) return;
          close();
          /* Escape returns focus to the link; an outside click leaves it where it landed. */
          if (event.type === "keydown") {
            skipFocusOpen.current = true;
            target?.focus();
          }
        }}
        positioning={{ target, position: "below", align: "center", offset: 4 }}
        inline
        unstable_disableAutoFocus
      >
        <PopoverSurface
          aria-label={menu.label}
          className="w-[48rem] max-w-[calc(100vw-2rem)] p-0"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line-divider px-5 py-3">
            <span className="text-headline-md">{menu.label}</span>
            <Link
              href={menu.href}
              onClick={close}
              className="flex items-center gap-1.5 text-label-md font-semibold text-primary underline-offset-4 hover:underline"
            >
              {menu.allLabel}
              <ArrowRight aria-hidden className="size-4 rtl:rotate-180" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-x-5 gap-y-5 px-5 py-4">
            {menu.columns.map((column) => (
              <section key={column.id} aria-label={column.name}>
                <Link
                  href={column.href}
                  onClick={close}
                  className="block text-body-md font-bold text-on-surface underline-offset-4 hover:text-primary hover:underline"
                >
                  {column.name}
                </Link>
                <ul className="mt-2 space-y-1.5">
                  {column.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={child.href}
                        onClick={close}
                        className="text-body-md text-on-surface-variant underline-offset-4 hover:text-on-surface hover:underline"
                      >
                        {child.name}
                      </Link>
                      {child.children.length ? (
                        <ul className="flex flex-wrap gap-x-2 ps-3 text-label-md">
                          {child.children.map((leaf) => (
                            <li key={leaf.id}>
                              <Link
                                href={leaf.href}
                                onClick={close}
                                className="text-muted underline-offset-4 hover:text-primary hover:underline"
                              >
                                {leaf.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {menu.others.length ? (
              <section aria-label={menu.othersLabel}>
                <p className="label-mono text-muted">{menu.othersLabel}</p>
                <ul className="mt-2 space-y-1.5">
                  {menu.others.map((branch) => (
                    <li key={branch.id}>
                      <Link
                        href={branch.href}
                        onClick={close}
                        className="text-body-md text-on-surface-variant underline-offset-4 hover:text-on-surface hover:underline"
                      >
                        {branch.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </PopoverSurface>
      </Popover>
    </div>
  );
}
