"use client";

import type { EmblaCarouselType } from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { authorTone, getAuthorInitials } from "@/components/author/author-card";
import { BookCover } from "@/components/book/book-cover";
import { cn } from "@/lib/utils";

/** One title of the showcase, flattened for the client — no `Localized` here. */
export interface HeroSlide {
  id: string;
  slug: string;
  title: string;
  author: string;
  /** Picks the author's portrait tone, the way the author card does. */
  authorSlug: string;
  coverUrl?: string;
  description: string;
}

export interface HeroShowcaseLabels {
  /** What assistive technology calls the jacket carousel. */
  region: string;
  /** A slide's position; `{index}` and `{total}` are substituted. */
  slide: string;
  /** The group of thumbnail buttons under it. */
  thumbnails: string;
}

interface HeroShowcaseProps {
  slides: HeroSlide[];
  dir: "rtl" | "ltr";
  labels: HeroShowcaseLabels;
  /** The copy column, rendered on the server and laid beside the jackets. */
  children: ReactNode;
}

/** How long a jacket holds before the next one slides in. */
const AUTOPLAY_DELAY = 3000;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * The global reduced-motion rule in `globals.css` only reaches CSS; Embla
 * moves the strips from script, so it has to be asked here as well.
 */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/**
 * The reference's tray: a plate seen at an angle, drawn under each thumbnail
 * and lit in the brand colour under the one that is showing. Only its stroke
 * is painted, so it is a shape and not a fill competing with the jacket.
 */
const TRAY_PATH =
  "M0.682517 80.6118L0.501193 39.6946C0.480127 34.9409 3.80852 30.8294 8.46241 29.8603L148.426 " +
  "0.713985C154.636 -0.579105 160.465 4.16121 160.465 10.504V80.7397C160.465 86.2674 155.98 " +
  "90.7465 150.453 90.7397L10.6701 90.5674C5.16936 90.5607 0.706893 86.1125 0.682517 80.6118Z";

/**
 * Three strips of the same titles, kept on the same one: the jacket beside
 * the copy, the row of thumbnails that picks it, and the line about it.
 *
 * Each strip is its own Embla instance — that is what lets each be dragged —
 * and they are tied through one `current` index: whichever strip moves
 * reports its selection, and the other two are scrolled to match. The jacket
 * strip is the only one that plays by itself; it stops while the pointer or
 * keyboard focus is over the showcase, because its slides are links and a
 * link that slides away under the pointer cannot be clicked.
 *
 * Slides that are not showing are `inert`: every title here is reachable
 * from the thumbnails, so there is no reason for a keyboard to tab through
 * eleven off-screen links to get past the hero.
 */
export function HeroShowcase({ slides, dir, labels, children }: HeroShowcaseProps) {
  const total = slides.length;
  const reduced = usePrefersReducedMotion();

  /*
    A new plugin object when reduced motion changes: Embla compares plugin
    options and re-initialises, which is how the strip stops or starts
    without a page load. `stopOnFocusIn` is off because the plugin can only
    watch its own slides; the focus handling below covers all three strips.
  */
  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: AUTOPLAY_DELAY,
        playOnInit: !reduced,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        stopOnFocusIn: false,
      }),
    [reduced],
  );

  const [mainRef, mainApi] = useEmblaCarousel({ loop: true, direction: dir }, [autoplay]);

  /*
    Never the object above — always the instance Embla is running. The hook
    compares plugins by their options, so a fresh object with the same
    options (a Fast Refresh, or React dropping a memo) is never handed to
    Embla and never initialised; calling it would reach for an `emblaApi` it
    does not have. `plugins()` answers with whichever instance was set up.
  */
  const runningAutoplay = () => mainApi?.plugins().autoplay;
  /*
    `containScroll: false` keeps one snap per thumbnail even when there are
    too few to loop. Trimmed snaps would make the strip report a smaller index
    than the jacket it was asked to show, and the two would fight.
  */
  const [thumbsRef, thumbsApi] = useEmblaCarousel({
    loop: true,
    direction: dir,
    containScroll: false,
  });
  const [captionsRef, captionsApi] = useEmblaCarousel({ loop: true, direction: dir });

  const [current, setCurrent] = useState(0);

  // Whichever strip moved, the index follows it.
  useEffect(() => {
    const apis = [mainApi, thumbsApi, captionsApi].filter(
      (api): api is EmblaCarouselType => api !== undefined,
    );
    const unsubscribe = apis.map((api) => {
      const onSelect = () => setCurrent(api.selectedScrollSnap());
      api.on("select", onSelect);
      return () => {
        api.off("select", onSelect);
      };
    });
    return () => unsubscribe.forEach((off) => off());
  }, [mainApi, thumbsApi, captionsApi]);

  // And the other two follow the index. A jump rather than a glide when asked.
  useEffect(() => {
    for (const api of [mainApi, thumbsApi, captionsApi]) {
      if (api && api.selectedScrollSnap() !== current) api.scrollTo(current, reduced);
    }
  }, [current, reduced, mainApi, thumbsApi, captionsApi]);

  /* The plugin's own timer restarts after a pick, so a jacket chosen by hand
     holds for the full delay rather than for whatever was left of it. */
  const select = useCallback(
    (index: number) => {
      setCurrent(index);
      mainApi?.plugins().autoplay.reset();
    },
    [mainApi],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!mainApi || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;

    event.preventDefault();
    // "Forward" is the direction the text runs in.
    const forward = (event.key === "ArrowRight") === (dir === "ltr");
    if (forward) mainApi.scrollNext(reduced);
    else mainApi.scrollPrev(reduced);
    runningAutoplay()?.reset();
  };

  const onFocus = () => runningAutoplay()?.stop();

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    // With one slide the plugin never armed itself; playing it would throw.
    if (!reduced && total > 1) runningAutoplay()?.play();
  };

  const slideLabel = (index: number) =>
    labels.slide.replace("{index}", String(index + 1)).replace("{total}", String(total));

  return (
    /*
      The handlers sit on the whole showcase — copy included, since the grid
      puts it here — so a key or a focus anywhere in it reaches the strips.
      The carousel role goes on the jacket strip alone: the heading and the
      buttons beside it are not part of a carousel and should not be read
      as one.
    */
    <div
      className="flex flex-col gap-12 lg:gap-16"
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div className="grid grid-cols-1 gap-6 gap-y-12 md:gap-y-16 lg:grid-cols-5">
        <div className="lg:col-span-3">{children}</div>

        {/*
          Every viewport is `relative` and clips one axis only.

          `relative`: Embla's track carries a 3D transform, so Chromium paints
          it on its own compositing layer, and a full-page capture placed
          that layer at the viewport's own page offset a second time — the
          strip drew a hundred pixels off on a desktop, twenty-four on a
          tablet — while the DOM measured it in place. The thumbnail strip
          never suffered it: its viewport sits in a positioned wrapper, so
          the offset being doubled was zero. Positioning each viewport makes
          that true of all three.

          `overflow-x-clip` rather than `overflow-hidden`: hidden makes a
          scroll container, which a `scrollIntoView` on a slide can scroll
          out from under Embla; clip cannot be scrolled. Clipping one axis
          also leaves the jacket's shadow whole.
        */}
        <div
          ref={mainRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={labels.region}
          className="relative overflow-x-clip lg:col-span-2"
        >
          <div className="flex touch-pan-y touch-pinch-zoom">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                role="group"
                aria-roledescription="slide"
                aria-label={slideLabel(index)}
                inert={index !== current}
                className="flex min-w-0 shrink-0 grow-0 basis-full items-center justify-center"
              >
                <Link
                  href={`/books/${slide.slug}`}
                  aria-label={slide.title}
                  className="block w-52 rounded-lg sm:w-60 lg:w-72"
                >
                  <BookCover
                    title={slide.title}
                    author={slide.author}
                    seed={slide.slug}
                    src={slide.coverUrl}
                    priority={index === 0}
                    sizes="(min-width: 1024px) 18rem, (min-width: 640px) 15rem, 13rem"
                    className="rounded-lg elevation-lg"
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-24 gap-y-12 md:gap-y-16 lg:grid-cols-5">
        <div className="relative max-lg:order-2 lg:col-span-3">
          {/* The strip fades into the page at both edges instead of being cut. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 start-0 z-1 w-16 bg-linear-to-r from-surface to-transparent sm:w-25 rtl:bg-linear-to-l"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 end-0 z-1 w-16 bg-linear-to-l from-surface to-transparent sm:w-25 rtl:bg-linear-to-r"
          />

          <div ref={thumbsRef} role="group" aria-label={labels.thumbnails} className="relative overflow-x-clip">
            <div className="-ms-4 flex touch-pan-y touch-pinch-zoom py-1">
              {slides.map((slide, index) => {
                const showing = index === current;

                return (
                  <div
                    key={slide.id}
                    className="min-w-0 shrink-0 grow-0 basis-1/2 ps-4 sm:basis-1/3 md:basis-1/4 lg:basis-1/3 xl:basis-1/4"
                  >
                    {/*
                      `isolate` gives the tray's negative z-index a context of
                      its own, so it sits behind the jacket rather than behind
                      the page background.
                    */}
                    <button
                      type="button"
                      aria-label={slide.title}
                      aria-current={showing ? "true" : undefined}
                      onClick={() => select(index)}
                      className="relative isolate flex h-33 w-full cursor-pointer items-center justify-center rounded-lg"
                    >
                      <svg
                        aria-hidden
                        viewBox="0 0 161 92"
                        fill="none"
                        className={cn(
                          "absolute bottom-0 -z-1 h-auto w-40 max-w-[90%] transition-colors duration-100 ease-fluent rtl:-scale-x-100",
                          showing ? "text-primary" : "text-line",
                        )}
                      >
                        <path d={TRAY_PATH} stroke="currentColor" />
                      </svg>
                      <span className="block w-18">
                        <BookCover
                          title={slide.title}
                          author={slide.author}
                          seed={slide.slug}
                          src={slide.coverUrl}
                          sizes="4.5rem"
                          compact
                          className="rounded-sm elevation-sm"
                        />
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div ref={captionsRef} className="relative flex items-center overflow-x-clip lg:col-span-2">
          <div className="flex w-full touch-pan-y touch-pinch-zoom">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                inert={index !== current}
                className="flex min-h-14 min-w-0 shrink-0 grow-0 basis-full justify-center gap-4 px-6 lg:items-center"
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full border-4 border-surface font-display text-body-md font-bold elevation-md",
                    authorTone(slide.authorSlug),
                  )}
                >
                  {getAuthorInitials(slide.author)}
                </span>
                <span
                  aria-hidden
                  className="hidden h-6 w-0.5 shrink-0 self-center rounded-full bg-primary-container sm:block"
                />
                <div className="min-w-0">
                  <p className="text-body-md">
                    <Link
                      href={`/books/${slide.slug}`}
                      className="font-semibold text-on-surface transition-colors duration-100 ease-fluent hover:text-primary"
                    >
                      {slide.title}
                    </Link>
                    <span className="text-muted"> · {slide.author}</span>
                  </p>
                  <p className="line-clamp-2 text-body-md text-on-surface-variant">
                    {slide.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
