"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";

interface ActionFormProps {
  /** A server action, usually pre-bound to the row it edits. */
  action: (formData: FormData) => Promise<ActionResult>;
  successTitle: string;
  fallbackError: string;
  /** Maps an action's error code to a human sentence. */
  errorMessages?: Record<string, string>;
  redirectTo?: string;
  resetOnSuccess?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A form that runs a server action and reports the outcome. Native validation
 * still runs first, so required fields behave as they always did.
 */
export function ActionForm({
  action,
  successTitle,
  fallbackError,
  errorMessages,
  redirectTo,
  resetOnSuccess = false,
  className,
  children,
}: ActionFormProps) {
  const toast = useToast();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = event.currentTarget;
    let result: ActionResult;
    try {
      result = await action(new FormData(form));
    } catch {
      // The request itself failed — offline, or a body the server refused
      // before the action ran, such as a cover past the size limit. Reported
      // like any other failed action rather than left hanging.
      result = { ok: false, error: "request" };
    }
    setPending(false);

    if (result.ok) {
      toast({ title: successTitle });
      if (resetOnSuccess) form.reset();
      if (redirectTo) router.push(redirectTo);
      router.refresh();
      return;
    }

    const message = errorMessages?.[result.error] ?? fallbackError;
    setError(message);
    toast({ title: message, tone: "error" });

    // The row this form edits was removed meanwhile; show the page as it is.
    if (result.error === "notFound") router.refresh();
  };

  return (
    <form className={className} onSubmit={onSubmit} aria-busy={pending}>
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 border border-line bg-error-container px-4 py-3 text-body-md text-on-error-container"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          {error}
        </p>
      ) : null}

      {children}
    </form>
  );
}
