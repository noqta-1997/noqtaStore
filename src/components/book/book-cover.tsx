import Image from "next/image";

import { noqtaBrand } from "@/theme/noqta-brand";
import { cn, hashString } from "@/lib/utils";

/**
 * Derived from the brand ramp rather than hand-picked.
 *
 * Covers are printed objects, so they keep the same colours in light and dark
 * instead of inverting with the UI — which is why they read from `noqtaBrand`
 * directly and not from the theme-aware tokens. Every pair clears 4.5:1 at
 * full strength: 5.83 at the tightest, 14.76 at the widest. The eight steps
 * span the ramp end to end, so a shelf still reads as varied.
 */
const coverPalette = [
  { background: noqtaBrand[10], foreground: noqtaBrand[150] },
  { background: noqtaBrand[80], foreground: noqtaBrand[160] },
  { background: noqtaBrand[150], foreground: noqtaBrand[40] },
  { background: noqtaBrand[40], foreground: noqtaBrand[140] },
  { background: noqtaBrand[100], foreground: noqtaBrand[10] },
  { background: noqtaBrand[60], foreground: noqtaBrand[160] },
  { background: noqtaBrand[130], foreground: noqtaBrand[20] },
  { background: noqtaBrand[30], foreground: noqtaBrand[130] },
] as const;

interface BookCoverProps {
  title: string;
  author: string;
  /** Stable key for picking the placeholder colour. */
  seed: string;
  src?: string;
  /** `sizes` for the real image; ignored by the placeholder. */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Renders a real cover when one exists, otherwise draws a typographic
 * placeholder. Swapping in real artwork later means only setting `src`.
 */
export function BookCover({
  title,
  author,
  seed,
  src,
  sizes = "(min-width: 1024px) 20vw, (min-width: 640px) 30vw, 45vw",
  priority = false,
  className,
}: BookCoverProps) {
  const palette = coverPalette[hashString(seed) % coverPalette.length];

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-md bg-surface-low",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={title}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-full w-full flex-col justify-end gap-3 p-3 sm:p-4"
          style={{ backgroundColor: palette.background, color: palette.foreground }}
        >
          {/* spine */}
          <span
            className="absolute inset-y-0 start-0 w-2 border-e opacity-30"
            style={{
              backgroundColor: palette.foreground,
              borderColor: palette.background,
            }}
          />
          <p className="ms-3 line-clamp-4 font-display text-sm leading-snug font-bold text-balance sm:text-base">
            {title}
          </p>
          {/*
            No opacity here. At 10px this is small text and needs the full
            4.5:1; the eight palettes all clear it at full strength, but
            `opacity-80` dropped three of them to 3.33, 4.30 and 4.34. It was
            the only accessibility violation left in the whole suite.
          */}
          <p
            className="ms-3 border-t pt-2 text-[0.625rem] font-medium"
            style={{ borderColor: palette.foreground }}
          >
            {author}
          </p>
        </div>
      )}
    </div>
  );
}
