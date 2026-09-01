import Image from "next/image";

import { cn, hashString } from "@/lib/utils";

/**
 * Fixed heritage palette. Covers are printed objects — they keep the same
 * colours in light and dark mode instead of inverting with the UI.
 */
const coverPalette = [
  { background: "#1d1c13", foreground: "#f6f0e2" },
  { background: "#ff6b35", foreground: "#5f1900" },
  { background: "#ffdbd0", foreground: "#5f1900" },
  { background: "#a19883", foreground: "#1d1c13" },
  { background: "#832600", foreground: "#ffdbd0" },
  { background: "#645e4b", foreground: "#f6f0e2" },
  { background: "#e2dfde", foreground: "#1d1c13" },
  { background: "#333027", foreground: "#ece2c9" },
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
        "relative aspect-[2/3] w-full overflow-hidden bg-surface-high",
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
          <p
            className="ms-3 border-t pt-2 font-mono text-[0.625rem] opacity-80"
            style={{ borderColor: palette.foreground }}
          >
            {author}
          </p>
        </div>
      )}
    </div>
  );
}
