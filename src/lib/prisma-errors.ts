/**
 * Telling a duplicate apart from a real failure.
 *
 * Prisma reports database errors as objects carrying a `code` — P2002 for a
 * unique-constraint violation, P2003 for a broken foreign key, and so on —
 * plus a `meta` object naming the constraint or column involved. The helpers
 * duck-type on those fields rather than `instanceof` the generated error
 * class, so they work on whatever the driver adapter hands back.
 */

type PrismaShaped = { code?: unknown; meta?: unknown; message?: unknown };

function shape(error: unknown): PrismaShaped | null {
  return typeof error === "object" && error !== null ? (error as PrismaShaped) : null;
}

/** The Prisma error code (`P2002`…), or null for anything that is not one. */
export function prismaErrorCode(error: unknown): string | null {
  const code = shape(error)?.code;
  return typeof code === "string" && /^P\d{4}$/.test(code) ? code : null;
}

/** Prisma reports a duplicate key as P2002, whatever the constraint. */
export function isUniqueViolation(error: unknown): boolean {
  return prismaErrorCode(error) === "P2002";
}

/**
 * P2003: a foreign key refused the write. On a delete that is a row in
 * another table still pointing at this one (`RESTRICT`/`NO ACTION`); the
 * constraint's name is in `meta.driverAdapterError.cause.constraint.index`.
 */
export function isForeignKeyViolation(error: unknown): boolean {
  return prismaErrorCode(error) === "P2003";
}

/**
 * P2025: the row a `delete`/`update` was addressed to is not there — usually
 * because another admin removed it after this page was rendered.
 */
export function isMissingRecord(error: unknown): boolean {
  return prismaErrorCode(error) === "P2025";
}

/**
 * A CHECK constraint refused the row. Prisma has no code of its own for
 * that — it arrives as the generic P2039 — so the Postgres code (23514) is
 * read from the driver adapter's cause.
 */
export function isCheckViolation(error: unknown): boolean {
  const meta = shape(error)?.meta as
    | { driverAdapterError?: { cause?: { originalCode?: unknown } } }
    | undefined;
  return meta?.driverAdapterError?.cause?.originalCode === "23514";
}

/**
 * Puts the real cause of a failed server action in the server log, where a
 * generic "could not save" toast cannot. The admin sees the toast; whoever
 * reads the log sees the Prisma code, the constraint it names, and the
 * stack. `context` is for identifiers only — never form contents.
 */
export function logActionError(
  action: string,
  error: unknown,
  context: Record<string, string | number | null> = {},
): void {
  const code = prismaErrorCode(error);
  const meta = shape(error)?.meta;
  const message = error instanceof Error ? error.message : String(error);

  console.error(
    `[actions] ${action} failed${code ? ` (${code})` : ""}: ${message.split("\n").pop()}`,
    { ...context, ...(code ? { code } : {}), ...(meta ? { meta } : {}) },
    error,
  );
}
