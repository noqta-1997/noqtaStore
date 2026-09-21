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

/**
 * Reads a name — a value the database keeps unique. Runs of whitespace
 * collapse to one space so the key compares what the eye compares: a name
 * typed with two spaces is the same name, not a second row.
 */
export function name(form: FormData, field: string): string {
  return text(form, field).replace(/\s+/g, " ");
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

/**
 * Awaits a server action from the browser and never throws.
 *
 * An action answers through its result, but the call itself can still fail —
 * the connection dropped, the server refused the body, the action hit an
 * error it did not expect. Every button that awaited one directly was left
 * disabled with no message when that happened: `setPending(false)` came
 * after the `await`, and the rejection skipped it. Here that failure comes
 * back as a result like any other, under the `request` code, so the caller
 * shows its usual failure toast and its button comes back.
 */
export async function runAction(call: Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await call;
  } catch (error) {
    console.error("[actions] call failed before it could answer", error);
    return fail("request");
  }
}
