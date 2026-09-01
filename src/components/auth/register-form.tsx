"use client";

import { AlertTriangle, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ValidatedField } from "@/components/ui/validated-field";
import type { Dictionary } from "@/i18n/get-dictionary";
import { createClient } from "@/utils/supabase/client";

interface RegisterFormProps {
  locale: string;
  t: Dictionary["auth"];
  validation: Dictionary["common"]["validation"];
}

export function RegisterForm({ locale, t, validation }: RegisterFormProps) {
  const router = useRouter();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [pending, setPending] = useState(false);

  const checkPassword = (value: string) => {
    if (!value) return validation.required;
    if (value.length < 8) return validation.minLength.replace("{n}", "8");
    if (!/\d/.test(value)) return t.passwordHint;
    return null;
  };

  const checkConfirm = (value: string, password: string) => {
    if (!value) return validation.required;
    if (value !== password) return validation.mismatch;
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
    const confirmIssue = checkConfirm(read("confirmPassword"), password);
    setPasswordError(passwordIssue);
    setConfirmError(confirmIssue);
    if (passwordIssue || confirmIssue) return;

    setPending(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: read("email").trim(),
      password,
      options: {
        data: { full_name: read("name").trim(), phone: read("phone").trim() },
      },
    });

    if (error) {
      setPending(false);
      setFormError(
        error.message.toLowerCase().includes("already")
          ? t.errors.emailInUse
          : error.message.toLowerCase().includes("password")
            ? t.errors.weakPassword
            : t.errors.generic,
      );
      return;
    }

    // With email confirmation enabled Supabase returns no session yet.
    if (!data.session) {
      setPending(false);
      setAwaitingEmail(true);
      return;
    }

    router.replace(`/auth/after-sign-in?locale=${locale}`);
    router.refresh();
  };

  if (awaitingEmail) {
    return (
      <div className="flex flex-col items-center gap-3 border border-line bg-surface-high p-6 text-center">
        <span className="flex size-12 items-center justify-center border border-line bg-success text-white">
          <MailCheck aria-hidden className="size-5" strokeWidth={2} />
        </span>
        <p className="text-body-md font-semibold text-on-surface">{t.checkEmailTitle}</p>
        <p className="text-body-md text-on-surface-variant">{t.checkEmailBody}</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      {formError ? (
        <p
          role="alert"
          className="flex items-start gap-2 border border-line bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {formError}
        </p>
      ) : null}

      <ValidatedField
        id="name"
        name="name"
        autoComplete="name"
        required
        label={t.fullName}
        messages={validation}
      />

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

      <ValidatedField
        id="phone"
        name="phone"
        type="tel"
        dir="ltr"
        inputMode="tel"
        placeholder="+964 7XX XXX XXXX"
        autoComplete="tel"
        required
        label={t.phone}
        messages={validation}
      />

      <Field
        label={t.password}
        htmlFor="password"
        hint={t.passwordHint}
        error={passwordError ?? undefined}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          aria-invalid={passwordError ? true : undefined}
          onBlur={(event) => setPasswordError(checkPassword(event.target.value))}
          onChange={(event) => {
            if (passwordError) setPasswordError(checkPassword(event.target.value));
          }}
          labels={{ show: t.showPassword, hide: t.hidePassword }}
        />
      </Field>

      <Field
        label={t.confirmPassword}
        htmlFor="confirmPassword"
        error={confirmError ?? undefined}
      >
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          aria-invalid={confirmError ? true : undefined}
          onBlur={(event) => {
            const password = (
              event.target.form?.elements.namedItem("password") as HTMLInputElement
            )?.value;
            setConfirmError(checkConfirm(event.target.value, password ?? ""));
          }}
          labels={{ show: t.showPassword, hide: t.hidePassword }}
        />
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? t.working : t.registerCta}
      </Button>

      <p className="text-label-sm text-muted">{t.terms}</p>
    </form>
  );
}
