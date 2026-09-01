"use client";

import { AlertTriangle } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/utils/supabase/client";

interface ChangePasswordFormProps {
  labels: {
    current: string;
    next: string;
    submit: string;
    success: string;
    tooShort: string;
    failure: string;
  };
}

/** Updates the Supabase identity directly — no server action needed. */
export function ChangePasswordForm({ labels }: ChangePasswordFormProps) {
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const password = (form.elements.namedItem("newPassword") as HTMLInputElement).value;

    if (password.length < 8) {
      setError(labels.tooShort);
      return;
    }

    setPending(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setPending(false);

    if (updateError) {
      setError(labels.failure);
      toast({ title: labels.failure, tone: "error" });
      return;
    }

    form.reset();
    toast({ title: labels.success });
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 border border-line bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels.current} htmlFor="currentPassword">
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
          />
        </Field>
        <Field label={labels.next} htmlFor="newPassword">
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
      </div>

      <Button variant="secondary" type="submit" disabled={pending}>
        {labels.submit}
      </Button>
    </form>
  );
}
