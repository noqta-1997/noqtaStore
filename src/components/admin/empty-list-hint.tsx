import Link from "next/link";

interface EmptyListHintProps {
  /** The sentence up to the link: "none yet — add them from the page". */
  text: string;
  href: string;
  /** The page's name in the admin navigation, which is what the link says. */
  page: string;
}

/**
 * Under a required select with nothing in it. The form cannot be saved until
 * the list has an entry, so say so here rather than leave a dash that looks
 * like a choice not yet made.
 *
 * The link is underlined outright, not on hover: inside a sentence, colour
 * alone does not mark it as a link (axe's `link-in-text-block`).
 */
export function EmptyListHint({ text, href, page }: EmptyListHintProps) {
  return (
    <>
      {text}{" "}
      <Link href={href} className="text-primary underline underline-offset-4">
        {page}
      </Link>
    </>
  );
}
