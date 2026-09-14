import {
  MAX_COVER_BYTES,
  MAX_COVER_EDGE,
  type CoverProblem,
} from "@/lib/cover-image";

/*
 * Browser only: this leans on `<img>`, canvas and `File`, and is imported by
 * the cover picker alone.
 */

export type PreparedCover =
  | {
      ok: true;
      file: File;
      width: number;
      height: number;
      /** True when the browser re-encoded the picture to make it fit. */
      resized: boolean;
    }
  | { ok: false; error: CoverProblem };

/**
 * Scale of the long edge against `MAX_COVER_EDGE`, and JPEG quality, in the
 * order they are tried. Size is the first thing given up, quality the
 * second, and a smaller picture again only after that — a 2:3 jacket at
 * 1600px and 0.86 lands at a few hundred kilobytes, so the later rows are
 * for the pathological file.
 */
const ATTEMPTS: ReadonlyArray<readonly [scale: number, quality: number]> = [
  [1, 0.86],
  [1, 0.75],
  [0.75, 0.75],
  [0.5, 0.75],
];

/**
 * Brings a picked image within the cover limits before it leaves the browser.
 *
 * A phone photo is commonly 4000px across and several megabytes: far past
 * what a 24rem jacket needs, and past the 2 MB the server accepts. Rather
 * than send the owner off to shrink it by hand, it is decoded here, drawn at
 * no more than `MAX_COVER_EDGE` on its long side and re-encoded as JPEG. A
 * file already within both limits is handed back untouched, so a carefully
 * prepared cover is never recompressed.
 *
 * Decoding goes through an `<img>`, which every current browser orients by
 * the photo's EXIF tag, so a sideways phone picture comes out upright. A file
 * that will not decode is not the image its type claims; one that cannot be
 * brought under the size limit is reported as too large.
 */
export async function prepareCover(file: File): Promise<PreparedCover> {
  const url = URL.createObjectURL(file);

  try {
    let image: HTMLImageElement;
    try {
      image = await decode(url);
    } catch {
      return { ok: false, error: "invalidImage" };
    }

    const { naturalWidth: width, naturalHeight: height } = image;
    const edge = Math.max(width, height);
    if (edge <= MAX_COVER_EDGE && file.size <= MAX_COVER_BYTES) {
      return { ok: true, file, width, height, resized: false };
    }

    for (const [scale, quality] of ATTEMPTS) {
      const factor = Math.min(1, (MAX_COVER_EDGE * scale) / edge);
      const targetWidth = Math.max(1, Math.round(width * factor));
      const targetHeight = Math.max(1, Math.round(height * factor));
      const blob = await encode(image, targetWidth, targetHeight, quality);

      if (blob.size <= MAX_COVER_BYTES) {
        return {
          ok: true,
          file: new File([blob], jpegName(file.name), { type: "image/jpeg" }),
          width: targetWidth,
          height: targetHeight,
          resized: true,
        };
      }
    }

    return { ok: false, error: "imageTooLarge" };
  } catch {
    // The canvas could not draw or encode it — nothing more can be done here,
    // and the server's own limit is what the owner would run into next.
    return { ok: false, error: "imageTooLarge" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function decode(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  return image.decode().then(() => image);
}

function encode(
  image: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("canvas has no 2d context"));

  // JPEG has no alpha: what a PNG left transparent becomes white, not black.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas could not encode"))),
      "image/jpeg",
      quality,
    );
  });
}

/** `cover.png` → `cover.jpg`; the name is only ever shown back to the owner. */
function jpegName(name: string) {
  return `${name.replace(/\.[^.]+$/, "")}.jpg`;
}
