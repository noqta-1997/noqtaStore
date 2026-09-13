import { Heart, Library, Package } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Surface, surfaceTitleStyles } from "@/components/ui/surface";
import { getCustomer } from "@/data";
import { ActionForm } from "@/components/ui/action-form";
import { savePreferences, updateProfile } from "@/app/actions/account";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.account.profile.title };
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Surface as="section">
      <h2 className={surfaceTitleStyles()}>{title}</h2>
      <div className="space-y-4 p-5">{children}</div>
    </Surface>
  );
}

export default async function ProfilePage() {
  const locale = defaultLocale;

  const [dictionary, customer] = await Promise.all([
    getDictionary(locale),
    getCustomer(),
  ]);

  const t = dictionary.account.profile;

  const stats = [
    { icon: Package, value: customer.stats.orders, label: t.stats.orders },
    { icon: Heart, value: customer.stats.wishlist, label: t.stats.wishlist },
    { icon: Library, value: customer.stats.copiesBought, label: t.stats.copies },
  ];

  return (
    <div className="space-y-6">
      <ul className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <li
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-line bg-card p-4"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <stat.icon aria-hidden className="size-5" strokeWidth={1.75} />
            </span>
            <span>
              <span
                className="block text-2xl font-bold text-on-surface"
                data-numeric
              >
                {formatNumber(stat.value, locale)}
              </span>
              <span className="block text-label-sm text-muted">{stat.label}</span>
            </span>
          </li>
        ))}
      </ul>

      <Panel title={t.personalInfo}>
        <ActionForm
          className="space-y-4"
          action={updateProfile}
          successTitle={dictionary.common.toast.saved}
          fallbackError={dictionary.common.toast.actionFailed}
          errorMessages={{
            missingName: dictionary.common.actionErrors.missingName,
            unauthenticated: dictionary.common.toast.signInRequired,
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.fullName} htmlFor="name">
              <Input id="name" name="name" defaultValue={customer.name} />
            </Field>
            <Field label={t.email} htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                defaultValue={customer.email}
              />
            </Field>
            <Field label={t.phone} htmlFor="phone">
              <Input
                id="phone"
                name="phone"
                type="tel"
                dir="ltr"
                defaultValue={customer.phone}
              />
            </Field>
            <Field label={t.birthDate} htmlFor="birthDate">
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                dir="ltr"
                defaultValue={customer.birthDate}
              />
            </Field>
          </div>
          <Button type="submit">{t.saveChanges}</Button>
        </ActionForm>
      </Panel>

      <Panel title={t.preferences}>
        <ActionForm
          className="space-y-3"
          action={savePreferences}
          successTitle={dictionary.common.toast.saved}
          errorMessages={dictionary.common.actionErrors}
          fallbackError={dictionary.common.toast.actionFailed}
        >
          <Checkbox
            id="newsletter"
            name="newsletter"
            defaultChecked={customer.preferences.newsletter}
            label={t.newsletterOptIn}
          />
          <Checkbox
            id="offers"
            name="offers"
            defaultChecked={customer.preferences.offers}
            label={t.offersOptIn}
          />
          <Button type="submit">{t.saveChanges}</Button>
        </ActionForm>
      </Panel>
    </div>
  );
}
