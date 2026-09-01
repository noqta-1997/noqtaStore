import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/app/actions/marketing";
import { ActionForm } from "@/components/ui/action-form";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

interface NewsletterProps {
  dictionary: Dictionary["home"]["newsletter"];
  locale: Locale;
  toastTitle: string;
  errorMessages: Record<string, string>;
  fallbackError: string;
}

export function Newsletter({
  dictionary,
  locale,
  toastTitle,
  errorMessages,
  fallbackError,
}: NewsletterProps) {
  return (
    <section className="pb-12 lg:pb-16">
      <Container>
        <div className="grid items-center gap-6 border border-line bg-card p-6 sm:p-10 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <span className="flex size-11 items-center justify-center border border-line bg-primary-container text-on-primary-container">
              <Mail aria-hidden className="size-5" strokeWidth={2} />
            </span>
            <h2 className="text-headline-md sm:text-headline-lg">
              {dictionary.title}
            </h2>
            <p className="max-w-xl text-body-md leading-relaxed text-on-surface-variant">
              {dictionary.description}
            </p>
          </div>

          <ActionForm
            className="space-y-2 lg:col-span-5"
            action={subscribeNewsletter}
            successTitle={toastTitle}
            errorMessages={errorMessages}
            fallbackError={fallbackError}
            resetOnSuccess
          >
            <input type="hidden" name="locale" value={locale} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">
                {dictionary.placeholder}
              </label>
              <Input
                id="newsletter-email"
                name="email"
                type="email"
                required
                placeholder={dictionary.placeholder}
                className="sm:flex-1"
              />
              <Button type="submit" className="sm:w-auto" fullWidth>
                {dictionary.cta}
              </Button>
            </div>
            <p className="text-label-sm text-muted">{dictionary.note}</p>
          </ActionForm>
        </div>
      </Container>
    </section>
  );
}
