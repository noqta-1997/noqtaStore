import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The design system names font sizes semantically (`text-body-md`) and colours
 * semantically too (`text-on-primary-container`). Out of the box
 * tailwind-merge cannot tell those apart — it sees two `text-*` classes, calls
 * them a conflict, and silently drops the earlier one. That is how the primary
 * button lost its foreground colour and rendered dark text on the brand fill.
 *
 * Naming the font-size steps explicitly is enough: anything else after
 * `text-` is then treated as a colour, which is what it is.
 */
const FONT_SIZES = [
  "display-lg",
  "display-md",
  "headline-xl",
  "headline-lg",
  "headline-md",
  "body-lg",
  "body-md",
  "label-md",
  "label-sm",
] as const;

const twMerge = extendTailwindMerge({
  override: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZES] }],
    },
  },
});

/** Merge conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Stable non-negative hash — used for deterministic placeholder visuals. */
export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
