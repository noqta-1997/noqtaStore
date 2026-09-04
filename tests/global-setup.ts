import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { chromium, type FullConfig } from "@playwright/test";

import { OWNER_EMAIL } from "../src/lib/owner";

import { GATED_PAGES, LOCALES, PUBLIC_PAGES } from "./fixtures/pages";
import { STORAGE_STATE } from "./fixtures/harness";

loadEnv({ path: ".env.local" });

/**
 * Mints a session for the owner, if the machine has been told how.
 *
 * The suite reads `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` — gitignored,
 * the same file the app already keeps its database credentials in, and it
 * never reaches this repository. Without it this step is skipped, the gated
 * specs skip with it, the run stays green and the gap stays visible.
 *
 * It used to drive the login form. That form is gone: sign-in is Google only
 * now, and Google refuses to authenticate inside an automation-controlled
 * browser — which is the whole reason this goes around the browser instead.
 * Nor can the session be lifted out of a real Chrome profile: since Chrome
 * 127 the cookie jar is sealed with an app-bound key that only Chrome itself
 * can open.
 *
 * So the session is issued the way Supabase issues one for a custom email
 * provider: `generateLink` produces a single-use token for the address, and
 * `verifyOtp` exchanges it. That is a real token from the real auth server —
 * not a forged cookie — which is what makes the captures worth looking at.
 *
 * The cookie is written by `@supabase/ssr` rather than by hand. Its wire
 * format is an implementation detail of that package (a `base64-` prefix,
 * and chunking across numbered cookies once the session outgrows one), and
 * hand-rolling it would work until the day the package changed it. Letting
 * the same version the app runs do the writing means the two cannot disagree.
 *
 * The address comes from `src/lib/owner.ts`, not from an environment
 * variable, because `pinOwnerRole` demotes anyone else on sight: a session
 * for any other account would reach the storefront and be redirected away
 * from `/admin`, and the admin half of the baseline would capture redirects.
 */
async function saveSession() {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!service || !url || !anon) {
    console.log(
      "  no SUPABASE_SERVICE_ROLE_KEY in .env.local — gated pages will skip",
    );
    return false;
  }

  try {
    const admin = createSupabaseClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: OWNER_EMAIL,
    });

    if (linkError) throw linkError;

    const tokenHash = link.properties?.hashed_token;
    if (!tokenHash) throw new Error("generateLink returned no hashed_token");

    /*
     * An in-memory cookie jar standing in for the browser's. The client
     * writes the session into it in exactly the shape the app reads back.
     */
    const jar = new Map<string, { value: string; options: CookieOptions }>();

    const client = createServerClient(url, anon, {
      cookies: {
        getAll: () =>
          [...jar].map(([name, { value }]) => ({ name, value })),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            jar.set(name, { value, options: options ?? {} });
          }
        },
      },
    });

    const { data, error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });

    if (error) throw error;
    if (!data.session) throw new Error("verifyOtp returned no session");

    const cookies = [...jar].map(([name, { value, options }]) => ({
      name,
      value,
      domain: "localhost",
      path: options.path ?? "/",
      // Playwright wants seconds since the epoch; -1 means a session cookie.
      expires: data.session!.expires_at ?? -1,
      httpOnly: options.httpOnly ?? false,
      secure: options.secure ?? false,
      sameSite: "Lax" as const,
    }));

    mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
    writeFileSync(
      STORAGE_STATE,
      JSON.stringify({ cookies, origins: [] }, null, 2),
      "utf8",
    );

    console.log(
      `  minted a session for ${data.session.user.email} — account and admin pages captured`,
    );
    return true;
  } catch (error) {
    // A bad key should not take the other 522 tests down with it.
    const reason =
      error instanceof Error ? error.message.split("\n")[0] : "unknown";
    console.log(`  could not mint a session (${reason}) — gated pages will skip`);
    return false;
  }
}

/**
 * Warms every route before the suite starts.
 *
 * `next dev` compiles a route on its first request. Without this, the first
 * test to reach each page pays that cost and times out, which reads as a
 * failure of the page rather than of the server. The very first run of the
 * functional suite failed seven tests for exactly this reason and passed all
 * of them on the second, warm run — the kind of flake that would make every
 * later phase comparison untrustworthy.
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  const signedIn = await saveSession();
  const browser = await chromium.launch();

  // Signed out, a gated route compiles only the redirect, so warming those
  // pages is worth doing only once there is a session to reach them with.
  const context = signedIn
    ? await browser.newContext({ storageState: STORAGE_STATE })
    : await browser.newContext();
  const page = await context.newPage();

  const pages = signedIn ? [...PUBLIC_PAGES, ...GATED_PAGES] : PUBLIC_PAGES;
  const targets = LOCALES.flatMap((locale) =>
    pages.map((entry) => entry.path(locale)),
  );

  const started = Date.now();
  let compiled = 0;

  for (const target of targets) {
    try {
      await page.goto(`${baseURL}${target}`, {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      compiled += 1;
    } catch {
      // A route that will not warm will fail loudly in the suite itself,
      // which is a better place to report it than here.
    }
  }

  await browser.close();

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n  warmed ${compiled}/${targets.length} routes in ${seconds}s\n`);
}

export default globalSetup;
