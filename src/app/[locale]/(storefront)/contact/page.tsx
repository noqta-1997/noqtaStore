import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { ValidatedField } from "@/components/ui/validated-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Surface, surfaceTitleStyles } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/app/actions/marketing";
import { ActionForm } from "@/components/ui/action-form";
import { getStoreIdentity } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.info.contact.title };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [dictionary, identity] = await Promise.all([
    getDictionary(locale),
    getStoreIdentity(),
  ]);
  const t = dictionary.info.contact;

  const channels = [
    {
      icon: MapPin,
      label: identity.address || dictionary.footer.contact.address,
      ltr: false,
    },
    {
      icon: Phone,
      label: identity.phone || dictionary.footer.contact.phone,
      ltr: true,
    },
    {
      icon: Mail,
      label: identity.email || dictionary.footer.contact.email,
      ltr: true,
    },
  ];

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: `/${locale}` },
          { label: t.title },
        ]}
      />

      <Container className="grid gap-6 py-8 lg:grid-cols-12 lg:gap-8 lg:py-12">
        <Surface as="section" className="lg:col-span-7">
          <h2 className={surfaceTitleStyles()}>{t.formTitle}</h2>
          <ActionForm
            className="space-y-4 p-5"
            action={sendContactMessage}
            successTitle={dictionary.common.toast.sent}
            errorMessages={dictionary.common.actionErrors}
            fallbackError={dictionary.common.toast.actionFailed}
            resetOnSuccess
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ValidatedField
                id="contact-name"
                name="name"
                autoComplete="name"
                required
                label={t.name}
                messages={dictionary.common.validation}
              />
              <ValidatedField
                id="contact-email"
                name="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                required
                label={t.email}
                messages={dictionary.common.validation}
              />
            </div>
            <Field label={t.subject} htmlFor="contact-subject">
              <Input id="contact-subject" name="subject" required />
            </Field>
            <Field label={t.message} htmlFor="contact-message">
              <Textarea id="contact-message" name="message" rows={6} required />
            </Field>
            <Button type="submit" size="lg">
              {t.send}
            </Button>
          </ActionForm>
        </Surface>

        <aside className="space-y-4 lg:col-span-5">
          <Surface as="section">
            <h2 className={surfaceTitleStyles()}>{t.channels}</h2>
            <ul className="divide-y divide-line-divider">
              {channels.map((channel) => (
                <li key={channel.label} className="flex items-center gap-3 px-5 py-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                    <channel.icon aria-hidden className="size-4" strokeWidth={1.75} />
                  </span>
                  <span
                    className="text-body-md text-on-surface"
                    {...(channel.ltr ? { dir: "ltr", "data-numeric": true } : {})}
                  >
                    {channel.label}
                  </span>
                </li>
              ))}
            </ul>
          </Surface>

          <Surface
            as="section"
            appearance="filled-alternative"
            className="flex items-center gap-3 p-5"
          >
            <Clock aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
            <div>
              <p className="label-mono text-muted">{t.hours}</p>
              <p className="text-body-md text-on-surface">{t.hoursValue}</p>
            </div>
          </Surface>
        </aside>
      </Container>
    </>
  );
}
