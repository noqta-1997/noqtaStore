"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface SocialButtonsProps {
  locale: string;
  labels: { google: string; divider: string; failure: string };
  className?: string;
}

/**
 * Google sign-in through Supabase. The provider has to be switched on in the
 * Supabase dashboard first; until then the button reports the refusal rather
 * than pretending to work.
 */
export function SocialButtons({ locale, labels, className }: SocialButtonsProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const signIn = async () => {
    setError(null);
    setPending(true);

    const supabase = createClient();
    // Google returns to the callback route, which exchanges the code for a
    // session cookie before handing the reader on to their account.
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("locale", locale);

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
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-line bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-line bg-card text-body-md font-medium text-on-surface transition-[box-shadow,border-color] duration-100 ease-fluent hover:border-line-hover hover:elevation-sm disabled:opacity-60"
      >
        <span
          aria-hidden
          className="flex size-6 items-center justify-center rounded-full bg-surface-low font-display text-label-md font-bold"
        >
          G
        </span>
        {labels.google}
      </button>

      <div className="flex items-center gap-3 pt-1">
        <span aria-hidden className="h-px flex-1 bg-outline-variant" />
        <span className="text-label-md text-muted">{labels.divider}</span>
        <span aria-hidden className="h-px flex-1 bg-outline-variant" />
      </div>
    </div>
  );
}
