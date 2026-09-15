"use client";

import { Building2, ChevronDown, ChevronUp, Plus, Search, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

import { authorTone, getAuthorInitials } from "@/components/author/author-card";
import { BookCover } from "@/components/book/book-cover";
import { publisherTone } from "@/components/publisher/publisher-card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PickOption } from "@/types";

export interface PickListLabels {
  /** Placeholder and accessible name of the search field. */
  search: string;
  noResults: string;
  failed: string;
  /** Shown in place of the list while nothing is picked. */
  empty: string;
  add: string;
  remove: string;
  moveUp: string;
  moveDown: string;
  /** Shown under the list once `max` is reached; `{max}` is substituted. */
  full: string;
  /** The running count; `{count}` and `{max}` are substituted. */
  count: string;
}

interface PickListProps {
  /** The hidden input's name, repeated once per pick in list order. */
  name: string;
  initial: PickOption[];
  /** One turns the list into a single slot that a new pick replaces. */
  max: number;
  /** Fetches candidates for a term, leaving out the ids already picked. */
  search: (term: string, exclude: string[]) => Promise<PickOption[]>;
  locale: Locale;
  labels: PickListLabels;
}

/** Typing pauses this long before a search is sent. */
const DEBOUNCE_MS = 200;

interface Results {
  /** The term and exclusions these were fetched for. */
  request: string;
  items: PickOption[];
  failed: boolean;
}

/**
 * An ordered list of catalogue entries, filled from a search field.
 *
 * The picks post as repeated hidden inputs, so the form reads them back in
 * the order shown with `getAll` and nothing is serialised on the client.
 * The results open under the field while focus is anywhere inside the
 * control and close when it leaves — a plain list of "add" buttons rather
 * than a combobox, because the selection here is an ordered list with its
 * own move and remove controls, which is not the shape a combobox's
 * selected-options set describes.
 */
export function PickList({ name, initial, max, search, locale, labels }: PickListProps) {
  const [chosen, setChosen] = useState<PickOption[]>(initial);
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  /* Results are kept with the request they answer, so a stale list stays on
     screen while the next one loads instead of flashing "no results". */
  const [results, setResults] = useState<Results | null>(null);
  // Counts searches, so a slow one cannot land over a newer one's results.
  const ticket = useRef(0);
  const inputId = useId();

  const full = max > 1 && chosen.length >= max;
  const chosenKey = chosen.map((item) => item.id).join(",");
  const request = JSON.stringify([term, chosenKey]);
  const loading = open && results?.request !== request;
  /* The server already leaves out the picks, but a list fetched before the
     last pick is still on screen until its replacement lands. */
  const candidates =
    results?.items.filter((option) => !chosen.some((item) => item.id === option.id)) ?? [];

  useEffect(() => {
    if (!open || results?.request === request) return;

    const mine = ++ticket.current;
    const timer = setTimeout(async () => {
      try {
        const items = await search(term, chosenKey ? chosenKey.split(",") : []);
        if (mine === ticket.current) setResults({ request, items, failed: false });
      } catch {
        if (mine === ticket.current) setResults({ request, items: [], failed: true });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [open, term, chosenKey, request, results, search]);

  const add = (option: PickOption) => {
    if (max === 1) {
      setChosen([option]);
      setOpen(false);
      return;
    }
    if (chosen.length >= max || chosen.some((item) => item.id === option.id)) return;
    setChosen([...chosen, option]);
  };

  const remove = (id: string) => {
    setChosen(chosen.filter((item) => item.id !== id));
  };

  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= chosen.length) return;
    const next = [...chosen];
    [next[index], next[target]] = [next[target], next[index]];
    setChosen(next);
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="space-y-3" onBlur={onBlur} onKeyDown={onKeyDown}>
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">
          {labels.search}
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          strokeWidth={1.75}
        />
        <Input
          id={inputId}
          type="search"
          value={term}
          placeholder={full ? labels.full.replace("{max}", formatNumber(max, locale)) : labels.search}
          autoComplete="off"
          disabled={full}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="ps-8"
        />

        {open ? (
          <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-line bg-card elevation-md">
            {candidates.length ? (
              <ul className="max-h-72 divide-y divide-line-divider overflow-y-auto">
                {candidates.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      aria-label={`${labels.add}: ${option.label}`}
                      /* Keeps focus in the field, so the list is still open
                         when the click lands — on every browser. */
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => add(option)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-start transition-colors duration-100 ease-fluent hover:bg-state-hover"
                    >
                      <Jacket option={option} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-md font-semibold text-on-surface">
                          {option.label}
                        </span>
                        {option.sublabel ? (
                          <span className="block truncate text-label-md text-muted">
                            {option.sublabel}
                          </span>
                        ) : null}
                      </span>
                      <Plus aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={cn("px-3 py-3 text-body-md text-muted", loading && "invisible")}>
                {results?.failed ? labels.failed : labels.noResults}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {chosen.length ? (
        <ol className="divide-y divide-line-divider overflow-hidden rounded-md border border-line">
          {chosen.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2">
              {max > 1 ? (
                <span className="label-mono w-5 shrink-0 text-center text-muted" data-numeric>
                  {formatNumber(index + 1, locale)}
                </span>
              ) : null}
              <Jacket option={item} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md font-semibold text-on-surface">{item.label}</p>
                {item.sublabel ? (
                  <p className="truncate text-label-md text-muted">{item.sublabel}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                {max > 1 ? (
                  <>
                    <IconButton
                      size="md"
                      label={`${labels.moveUp}: ${item.label}`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ChevronUp aria-hidden className="size-4" strokeWidth={1.75} />
                    </IconButton>
                    <IconButton
                      size="md"
                      label={`${labels.moveDown}: ${item.label}`}
                      disabled={index === chosen.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ChevronDown aria-hidden className="size-4" strokeWidth={1.75} />
                    </IconButton>
                  </>
                ) : null}
                <IconButton
                  size="md"
                  label={`${labels.remove}: ${item.label}`}
                  onClick={() => remove(item.id)}
                >
                  <X aria-hidden className="size-4" strokeWidth={1.75} />
                </IconButton>
              </div>
              <input type="hidden" name={name} value={item.id} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-body-md text-muted">
          {labels.empty}
        </p>
      )}

      {max > 1 ? (
        <p className="text-label-md text-muted" data-numeric>
          {labels.count
            .replace("{count}", formatNumber(chosen.length, locale))
            .replace("{max}", formatNumber(max, locale))}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The entry's picture at row height: a category's icon in the round plate
 * its tile uses, an author's initials or a publisher's building mark in the
 * tone their card uses, or a jacket 32px wide, so the placeholder drops its
 * lettering.
 */
function Jacket({ option }: { option: PickOption }) {
  const { picture } = option;

  if (picture.kind === "icon") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
        <CategoryIcon name={picture.name} className="size-4" />
      </span>
    );
  }

  if (picture.kind === "portrait") {
    return (
      <span
        aria-hidden
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full font-display text-label-md font-bold",
          authorTone(option.seed),
        )}
      >
        {getAuthorInitials(option.label)}
      </span>
    );
  }

  if (picture.kind === "mark") {
    return (
      <span
        aria-hidden
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          publisherTone(option.seed),
        )}
      >
        <Building2 className="size-4" strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <div className="w-8 shrink-0">
      <BookCover
        title={option.label}
        author={option.sublabel ?? ""}
        seed={option.seed}
        src={picture.src}
        sizes="2rem"
        compact
        className="rounded-sm"
      />
    </div>
  );
}
