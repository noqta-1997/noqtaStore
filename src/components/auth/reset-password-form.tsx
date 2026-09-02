"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { PasswordInput } from "@/components/auth/password-input";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { Dictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/utils/supabase/client";

interface ResetPasswordFormProps {
  locale: string;
  t: Dictionary["auth"];
  validation: Dictionary["common"]["validation"];
}

type LinkState = "checking" | "ready" | "invalid";

/**
 * The recovery link signs the reader in for one purpose only: choosing a new
 * password. Without that session there is nothing to update, so the form is
 * replaced by an invitation to request a fresh link.
 */
export function ResetPasswordForm({ locale, t, validation }: ResetPasswordFormProps) {
  const router = useRouter();
  const [state, setState] = useState<LinkState>("checking");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const verify = async () => {
      // The browser client exchanges the code on its own when it can; this
      // only has to decide whether a usable session came out of it.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (!cancelled) setState("ready");
        return;
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) {
        if (!cancelled) setState("invalid");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!cancelled) setState(error ? "invalid" : "ready");
    };

    void verify();

    return () => {
      cancelled = true;
    };
  }, []);

  const checkPassword = (value: string) => {
    if (!value) return validation.required;
    if (value.length < 8) return validation.minLength.replace("{n}", "8");
    if (!/\d/.test(value)) return t.passwordHint;
    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const form = event.currentTarget;
    const read = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement).value;

    const password = read("password");
    const passwordIssue = checkPassword(password);
    const confirmIssue =
      read("confirmPassword") === password ? null : validation.mismatch;

    setPasswordError(passwordIssue);
    setConfirmError(confirmIssue);
    if (passwordIssue || confirmIssue) return;

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setPending(false);
      setFormError(
        error.message.toLowerCase().includes("password")
          ? t.errors.weakPassword
          : t.errors.generic,
      );
      return;
    }

    router.replace(`/auth/after-sign-in?locale=${locale}`);
    router.refresh();
  };

  if (state === "checking") {
    return (
      <p className="rounded-md border border-line bg-surface-low px-4 py-3 text-body-md text-on-surface-variant">
        {t.resetChecking}
      </p>
    );
  }

  if (state === "invalid") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-line bg-surface-low p-6 text-center">
        <span className="flex size-12 items-center justify-center border border-line bg-error-container text-on-error-container">
          <AlertTriangle aria-hidden className="size-5" strokeWidth={2} />
        </span>
        <p className="text-body-md font-semibold text-on-surface">
          {t.resetInvalidTitle}
        </p>
        <p className="text-body-md text-on-surface-variant">{t.resetInvalidBody}</p>
        <Link
          href={`/${locale}/forgot-password`}
          className={buttonStyles({ variant: "secondary" })}
        >
          {t.resetRequestAgain}
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate aria-busy={pending}>
      {formError ? (
        <p
          role="alert"
          className="flex items-start gap-2 border border-line bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {formError}
        </p>
      ) : null}

      <Field
        label={t.newPassword}
        htmlFor="password"
        hint={t.passwordHint}
        error={passwordError ?? undefined}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={passwordError ? true : undefined}
          labels={{ show: t.showPassword, hide: t.hidePassword }}
        />
      </Field>

      <Field
        label={t.confirmNewPassword}
        htmlFor="confirmPassword"
        error={confirmError ?? undefined}
      >
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={confirmError ? true : undefined}
          labels={{ show: t.showPassword, hide: t.hidePassword }}
        />
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? t.working : t.resetCta}
      </Button>
    </form>
  );
}
