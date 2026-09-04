import Image from "next/image";

import { noqtaCovers } from "@/theme/noqta-covers";
import { cn, hashString } from "@/lib/utils";

interface BookCoverProps {
  title: string;
  author: string;
  /** Stable key for picking the placeholder colour. */
  seed: string;
  src?: string;
  /** `sizes` for the real image; ignored by the placeholder. */
  sizes?: string;
  /**
   * Drops the lettering, keeping the jacket and its spine.
   *
   * Under about 60px the title sets two or three characters to a line and
   * the author rule becomes a smudge: it reads as damage rather than as
   * type. Every place that wants a cover that small — a table row, a line
   * in an order — is already printing the title beside it in full.
   */
  compact?: boolean;
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
  compact = false,
  priority = false,
  className,
}: BookCoverProps) {
  const palette = noqtaCovers[hashString(seed) % noqtaCovers.length];

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
          {compact ? null : (
            <>
              <p className="ms-3 line-clamp-4 font-display text-sm leading-snug font-bold text-balance sm:text-base">
                {title}
              </p>
              {/*
                No opacity here. At 10px this is small text and needs the full
                4.5:1; all twelve palettes clear it at full strength, but
                `opacity-80` dropped three of them to 3.33, 4.30 and 4.34. It
                was the only accessibility violation left in the whole suite.
              */}
              <p
                className="ms-3 border-t pt-2 text-[0.625rem] font-medium"
                style={{ borderColor: palette.foreground }}
              >
                {author}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
