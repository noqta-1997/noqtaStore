"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { ValidatedField } from "@/components/ui/validated-field";
import type { Dictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/utils/supabase/client";

interface LoginFormProps {
  locale: string;
  t: Dictionary["auth"];
  validation: Dictionary["common"]["validation"];
}

export function LoginForm({ locale, t, validation }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // A failed OAuth round trip comes back here rather than dying on the
  // callback route, so the reason has to be shown.
  const oauthFailed = searchParams.get("error") === "oauth";
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const checkPassword = (value: string) => {
    if (!value) return validation.required;
    if (value.length < 8) return validation.minLength.replace("{n}", "8");
    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const issue = checkPassword(password);
    setPasswordError(issue);
    if (issue) return;

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setPending(false);
      setFormError(
        error.status === 400 ? t.errors.invalidCredentials : t.errors.generic,
      );
      return;
    }

    // The session lives in cookies the server must re-read before rendering.
    const next = searchParams.get("next");
    router.replace(
      `/auth/after-sign-in?locale=${locale}${next ? `&next=${encodeURIComponent(next)}` : ""}`,
    );
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      {formError ?? (oauthFailed ? t.errors.generic : null) ? (
        <p
          role="alert"
          className="flex items-start gap-2 border border-line bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {formError ?? t.errors.generic}
        </p>
      ) : null}

      <ValidatedField
        id="email"
        name="email"
        type="email"
        dir="ltr"
        autoComplete="email"
        placeholder="you@example.com"
        required
        label={t.email}
        messages={validation}
      />

      <Field label={t.password} htmlFor="password" error={passwordError ?? undefined}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          aria-invalid={passwordError ? true : undefined}
          onBlur={(event) => setPasswordError(checkPassword(event.target.value))}
          onChange={(event) => {
            if (passwordError) setPasswordError(checkPassword(event.target.value));
          }}
          labels={{ show: t.showPassword, hide: t.hidePassword }}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox id="remember" name="remember" label={t.remember} />
        <Link
          href={`/${locale}/forgot-password`}
          className="text-label-md text-primary underline-offset-4 hover:underline"
        >
          {t.forgot}
        </Link>
      </div>

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? t.working : t.loginCta}
      </Button>
    </form>
  );
}
