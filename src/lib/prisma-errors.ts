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
