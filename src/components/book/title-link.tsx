import Link from "next/link";
import type { ReactNode } from "react";

interface TitleLinkProps {
  href: string;
  /** An archived title has no store page: its link would land on a 404. */
  archived?: boolean;
  /** Said under an archived title in place of the link, when given. */
  archivedNote?: string;
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
}

/**
 * A link to a title's store page from the reader's own history — an order,
 * a review. The history outlives the shelf: an archived title stays in both,
 * so it is drawn as it was, without the link, and says why.
 */
export function TitleLink({ href, archived, archivedNote, className, children, ...rest }: TitleLinkProps) {
  if (!archived) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }

  /* No hover underline on what is no longer a link, and no label: a plain
     span may not carry one, and the title beside it is the name. */
  return (
    <>
      <span className={className?.replace(/\bhover:\S+/g, "").trim()}>
        {children}
      </span>
      {archivedNote ? <span className="block text-label-sm text-muted">{archivedNote}</span> : null}
    </>
  );
}
