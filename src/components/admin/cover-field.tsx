"use client";

import { ImagePlus } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import { COVER_EXTENSIONS, COVER_MIME_TYPES, MAX_COVER_BYTES } from "@/lib/cover-image";
import { prepareCover } from "@/lib/cover-resize";

interface CoverFieldProps {
  labels: AdminDictionary["handoutForm"]["upload"];
  errors: Pick<Dictionary["common"]["actionErrors"], "invalidImage" | "imageTooLarge">;
  /** The cover the row has now, or its typographic placeholder. */
  children: ReactNode;
  /** The row has an uploaded cover, which the field then offers to remove. */
  hasCover?: boolean;
}

interface Chosen {
  name: string;
  url: string;
  /** Set when the browser shrank the picture; the status line says so. */
  resizedTo?: { width: number; height: number };
}

/**
 * The cover picker for the handout form.
 *
 * The file input is visually hidden behind the dashed label, so without this
 * island choosing a file changed nothing on screen and the upload looked
 * broken before it had begun. Now the chosen image takes the placeholder's
 * spot, the label shows its name, a picture too large for the server is
 * shrunk in the browser first — the form reads the input on submit, so the
 * smaller file is written back into it — and a file that still cannot be
 * used is refused here, with the same message the server would have sent.
 *
 * The forms key it on the row's cover URL. A saved cover changes that URL, so
 * the field starts over empty: it used to keep the file and its "will be
 * uploaded on save" line, and every later save of the form uploaded the same
 * picture again. A failed save leaves the URL — and the chosen file — as they
 * were, ready for another try.
 *
 * A row with a cover gets a "remove" box beside it, posted as `removeCover`:
 * without it a cover could be replaced but never taken off, so a wrong one
 * stayed until another picture was found for it. Choosing a file hides the
 * box — a new cover and a removal cannot both be meant.
 */
export function CoverField({ labels, errors, children, hasCover = false }: CoverFieldProps) {
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [removing, setRemoving] = useState(false);
  // Counts picks, so a slow resize cannot land after a newer pick.
  const pick = useRef(0);

  // The preview is an object URL, released once it is no longer shown.
  useEffect(() => {
    if (!chosen) return;
    return () => URL.revokeObjectURL(chosen.url);
  }, [chosen]);

  const onChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const ticket = ++pick.current;

    // Whatever an earlier pick was still doing no longer matters — including
    // the validity message it set, or a cancelled dialog would leave the form
    // refusing to submit.
    input.setCustomValidity("");
    setPreparing(false);
    setChosen(null);
    setError(null);
    setRemoving(false);
    if (!file) return;

    if (!(file.type in COVER_EXTENSIONS)) {
      // Cleared, so a refused file cannot ride along with the submit.
      input.value = "";
      setError(errors.invalidImage);
      return;
    }

    // Native validation holds a submit back until the picture is ready.
    setPreparing(true);
    input.setCustomValidity(labels.preparing);
    const prepared = await prepareCover(file);
    if (ticket !== pick.current) return;
    input.setCustomValidity("");
    setPreparing(false);

    if (!prepared.ok) {
      input.value = "";
      setError(errors[prepared.error]);
      return;
    }

    if (prepared.resized && !replaceFiles(input, prepared.file) && file.size > MAX_COVER_BYTES) {
      // A browser that cannot write the smaller file back would send the
      // original, and the server would refuse that; say so here instead.
      input.value = "";
      setError(errors.imageTooLarge);
      return;
    }

    setChosen({
      name: prepared.file.name,
      url: URL.createObjectURL(prepared.file),
      resizedTo: prepared.resized
        ? { width: prepared.width, height: prepared.height }
        : undefined,
    });
  };

  const status = preparing
    ? labels.preparing
    : chosen?.resizedTo
      ? labels.resized
          .replace("{width}", String(chosen.resizedTo.width))
          .replace("{height}", String(chosen.resizedTo.height))
      : chosen
        ? labels.ready
        : removing
          ? labels.removing
          : hasCover
            ? labels.current
            : labels.placeholder;

  return (
    <div className="space-y-3" aria-busy={preparing}>
      <div className="mx-auto w-full max-w-40 rounded-xl bg-surface-low p-4">
        {chosen ? (
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-low elevation-sm">
            <Image src={chosen.url} alt="" fill sizes="8rem" className="object-cover" />
          </div>
        ) : (
          <div className={removing ? "opacity-40" : undefined}>{children}</div>
        )}
      </div>

      <label
        htmlFor="coverImage"
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-outline p-5 text-center transition-colors duration-100 ease-fluent hover:border-line-hover hover:bg-state-hover"
      >
        <ImagePlus aria-hidden className="size-5 text-primary" strokeWidth={1.75} />
        <span className="max-w-full truncate text-label-md text-on-surface" dir="auto">
          {chosen ? chosen.name : labels.button}
        </span>
        <span className="text-label-md text-muted">{labels.hint}</span>
        <input
          id="coverImage"
          name="coverImage"
          type="file"
          accept={COVER_MIME_TYPES.join(",")}
          className="sr-only"
          aria-describedby="coverImage-status"
          aria-invalid={error ? true : undefined}
          onChange={onChange}
        />
      </label>

      {error ? (
        <p id="coverImage-status" role="alert" className="text-label-md text-error">
          {error}
        </p>
      ) : (
        <p id="coverImage-status" aria-live="polite" className="text-label-md text-muted">
          {status}
        </p>
      )}

      {hasCover && !chosen && !preparing ? (
        <Checkbox
          id="removeCover"
          name="removeCover"
          value="1"
          checked={removing}
          onChange={(event) => setRemoving(event.currentTarget.checked)}
          label={labels.remove}
        />
      ) : null}
    </div>
  );
}

/**
 * Puts the prepared file into the input in place of the one the owner
 * picked. `ActionForm` builds its `FormData` from the DOM, so this is what
 * makes the smaller file the one that is sent. False where the browser has
 * no `DataTransfer` to build a file list with.
 */
function replaceFiles(input: HTMLInputElement, file: File) {
  if (typeof DataTransfer === "undefined") return false;

  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  return true;
}
