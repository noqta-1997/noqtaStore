import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";

interface HeldCountProps {
  /** The titles on the shelf — what the column counts. */
  count: number;
  /** Lines under the figure, each shown only when its count is above zero. */
  notes?: { count: number; label: string }[];
  locale: Locale;
}

/**
 * A table's title count, with what else still holds the row written under
 * it: archived titles, a teacher's subject. Without them a row reading 0
 * refused to be deleted and gave no reason.
 */
export function HeldCount({ count, notes = [], locale }: HeldCountProps) {
  return (
    <>
      {formatNumber(count, locale)}
      {notes.map((note) =>
        note.count > 0 ? (
          <span key={note.label} className="block text-label-sm text-muted">
            {note.label.replace("{count}", formatNumber(note.count, locale))}
          </span>
        ) : null,
      )}
    </>
  );
}
