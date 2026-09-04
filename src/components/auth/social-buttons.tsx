"use client";

import { AlertTriangle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface SocialButtonsProps {
  locale: string;
  labels: { google: string; failure: string };
  className?: string;
}

/**
 * Google sign-in through Supabase — the only way into the store.
 *
 * The provider has to be switched on in the Supabase dashboard; until then
 * the button reports the refusal rather than pretending to work. That
 * mattered less when a password form sat underneath it and matters a great
 * deal now, because there is nothing underneath it any more.
 *
 * Two jobs moved here from the password form when that form was removed, and
 * both are load-bearing:
 *
 * - `?next=` has to survive the round trip. A reader sent here from the
 *   checkout arrives at `/login?next=/ar/checkout`, and without forwarding it
 *   to the callback they would come back signed in but on the home page,
 *   having lost what they were doing.
 * - `?error=oauth` is where the callback route parks a failed round trip.
 *   Nothing else on the page would say why the sign-in did not take.
 */
export function SocialButtons({ locale, labels, className }: SocialButtonsProps) {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const failed = error ?? (searchParams.get("error") === "oauth" ? labels.failure : null);

  const signIn = async () => {
    setError(null);
    setPending(true);

    const supabase = createClient();
    // Google returns to the callback route, which exchanges the code for a
    // session cookie before handing the reader on to where they were going.
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("locale", locale);

    const next = searchParams.get("next");
    if (next) callback.searchParams.set("next", next);

    const { error: failure } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });

    // A success hands the browser to Google, so only failures land here.
    setPending(false);
    if (failure) setError(labels.failure);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {failed ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-line bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          {failed}
        </p>
      ) : null}

      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-line bg-card text-body-lg font-semibold text-on-surface transition-[box-shadow,border-color] duration-100 ease-fluent hover:border-line-hover hover:elevation-sm disabled:opacity-60"
      >
        <span
          aria-hidden
          className="flex size-6 items-center justify-center rounded-full bg-surface-low font-display text-label-md font-bold"
        >
          G
        </span>
        {labels.google}
      </button>
    </div>
  );
}
