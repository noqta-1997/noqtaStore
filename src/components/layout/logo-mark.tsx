import Image from "next/image";

import { cn } from "@/lib/utils";

import logoLight from "../../../public/images/logo.png";
import logoDark from "../../../public/images/logoNM.png";

interface LogoMarkProps {
  /** Rendered height in pixels; the width follows the artwork's ratio. */
  size?: number;
  className?: string;
}

/**
 * The store's mark, in the artwork drawn for the current theme.
 *
 * Two files: `logo.png` is navy and grey for light grounds, `logoNM.png` is
 * the white silhouette for dark ones. They share a canvas and an ink bounding
 * box to the pixel, so the swap changes colour and nothing else — no shift, no
 * resize.
 *
 * Both are rendered and CSS shows one, rather than picking in JavaScript. The
 * theme is not knowable at render time: it comes from `localStorage` via the
 * script in the root layout, which runs before first paint, so a component that
 * chose here would have to guess and then correct itself — a visible flash of
 * the wrong mark on every load. Letting CSS decide means the right one is
 * painted the first time, under the system preference and under the manual
 * override alike. `<picture>` with `prefers-color-scheme` could not do it: that
 * media query cannot see the `data-theme` attribute the toggle writes.
 *
 * Sized by height with the width left to follow. The artwork is a 3508×2480
 * landscape canvas whose ink sits in a near-square block covering 68% of the
 * width and 89% of the height, so fitting it into a square slot would letterbox
 * it and leave the mark looking small; driving the height instead lands the ink
 * at roughly the size the slot implies.
 *
 * Imported as modules rather than by string path so the build carries the real
 * dimensions — that is what lets `next/image` reserve the box and avoid a
 * layout shift, and it fails the build if either file moves.
 */
export function LogoMark({ size = 36, className }: LogoMarkProps) {
  const width = Math.round((size * logoLight.width) / logoLight.height);
  const shared = cn("shrink-0 object-contain", className);

  return (
    <>
      <Image
        src={logoLight}
        alt=""
        aria-hidden
        data-logo="light"
        width={width}
        height={size}
        priority
        className={shared}
      />
      <Image
        src={logoDark}
        alt=""
        aria-hidden
        data-logo="dark"
        width={width}
        height={size}
        priority
        className={shared}
      />
    </>
  );
}
