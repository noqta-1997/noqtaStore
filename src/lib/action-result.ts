/** What every server action hands back to the client that called it. */
export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export const ok = (message?: string): ActionResult => ({ ok: true, message });
export const fail = (error: string): ActionResult => ({ ok: false, error });

/** Reads a trimmed string from a form, or "" when absent. */
export function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Reads a number from a form; NaN becomes the fallback. */
export function number(form: FormData, name: string, fallback = 0): number {
  const parsed = Number(text(form, name));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function optionalNumber(form: FormData, name: string): number | null {
  const raw = text(form, name);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function checkbox(form: FormData, name: string): boolean {
  return form.get(name) !== null;
}
