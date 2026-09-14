"use client";

import { ImagePlus } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";

import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import { COVER_MIME_TYPES, coverProblem } from "@/lib/cover-image";

interface CoverFieldProps {
  labels: AdminDictionary["bookForm"]["upload"];
  errors: Pick<Dictionary["common"]["actionErrors"], "invalidImage" | "imageTooLarge">;
  /** The cover the row has now, or its typographic placeholder. */
  children: ReactNode;
}

interface Chosen {
  name: string;
  url: string;
}

/**
 * The cover picker for the book and handout forms.
 *
 * The file input is visually hidden behind the dashed label, so without this
 * island choosing a file changed nothing on screen and the upload looked
 * broken before it had begun. Now the chosen image takes the placeholder's
 * spot, the label shows its name, and a file the server would refuse is
 * refused here first, with the same message it would have got back.
 */
export function CoverField({ labels, errors, children }: CoverFieldProps) {
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The preview is an object URL, released once it is no longer shown.
  useEffect(() => {
    if (!chosen) return;
    return () => URL.revokeObjectURL(chosen.url);
  }, [chosen]);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    setChosen(null);
    setError(null);
    if (!file) return;

    const problem = coverProblem(file);
    if (problem) {
      // Cleared, so a refused file cannot ride along with the submit.
      input.value = "";
      setError(errors[problem]);
      return;
    }

    setChosen({ name: file.name, url: URL.createObjectURL(file) });
  };

  return (
    <div className="space-y-3">
      <div className="mx-auto w-full max-w-40 rounded-xl bg-surface-low p-4">
        {chosen ? (
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface-low elevation-sm">
            <Image src={chosen.url} alt="" fill sizes="8rem" className="object-cover" />
          </div>
        ) : (
          children
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
        <p id="coverImage-status" className="text-label-md text-muted">
          {chosen ? labels.ready : labels.placeholder}
        </p>
      )}
    </div>
  );
}
