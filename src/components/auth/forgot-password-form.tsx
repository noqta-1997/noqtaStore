"use client";

import { AlertTriangle, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/utils/supabase/client";

interface ForgotPasswordFormProps {
  locale: string;
  t: Dictionary["auth"];
}

/**
 * Asks Supabase to mail a recovery link. An unknown address is not an error —
 * Supabase answers the same either way, so the page never reveals who is
 * registered.
 */
export function ForgotPasswordForm({ locale, t }: ForgotPasswordFormProps) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();

    setPending(true);
    const supabase = createClient();
    const { error: failure } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/reset-password`,
    });
    setPending(false);

    // Only a real failure — rate limiting, network — surfaces here.
    if (failure) {
      setError(t.errors.generic);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-line bg-surface-low p-6 text-center">
        <span className="flex size-12 items-center justify-center border border-line bg-success text-on-success">
          <MailCheck aria-hidden className="size-5" strokeWidth={2} />
        </span>
        <p className="text-body-md text-on-surface">{t.linkSent}</p>
        <p className="text-label-sm text-muted">{t.forgotHint}</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} aria-busy={pending}>
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 border border-line bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      ) : null}

      <Field label={t.email} htmlFor="email" hint={t.forgotHint}>
        <Input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? t.working : t.sendLink}
      </Button>
    </form>
  );
}
