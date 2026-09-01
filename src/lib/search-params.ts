export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** First value of a possibly repeated query parameter. */
export function readParam(
  params: SearchParamsRecord,
  key: string,
): string | undefined {
  const value = params[key];
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() ? first.trim() : undefined;
}

export function readNumberParam(
  params: SearchParamsRecord,
  key: string,
): number | undefined {
  const value = readParam(params, key);
  if (value === undefined) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function readBooleanParam(
  params: SearchParamsRecord,
  key: string,
): boolean {
  const value = readParam(params, key);
  return value === "1" || value === "true" || value === "on";
}

/** Serialises a partial query, dropping empty values. Always starts with "?". */
export function buildQueryString(
  entries: Record<string, string | number | boolean | undefined>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === "" || value === false) continue;
    params.set(key, value === true ? "1" : String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

/**
 * `?state=empty` renders a page's empty state against the mock data.
 * It exists so those states can be reviewed without emptying the fixtures.
 */
export function isEmptyPreview(params: SearchParamsRecord): boolean {
  return readParam(params, "state") === "empty";
}
