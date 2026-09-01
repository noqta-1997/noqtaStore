import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Panel } from "@/components/admin/panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioCard } from "@/components/ui/radio-card";
import { Select } from "@/components/ui/select";
import { getShippingRules, getStoreSettings } from "@/data";
import { isLocale, localeNames, locales } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { readParam, type SearchParamsRecord } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { ActionForm } from "@/components/ui/action-form";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { saveSettings } from "@/app/actions/admin";

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: SettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const admin = await getAdminDictionary(isLocale(locale) ? locale : "ar");

  return { title: `${admin.settings.title} — ${admin.brand.panel}` };
}

const tabs = ["store", "shipping", "payments", "account"] as const;
type Tab = (typeof tabs)[number];

export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const rawTab = readParam(await searchParams, "tab");
  const tab = (tabs.includes(rawTab as Tab) ? rawTab : "store") as Tab;

  const [dictionary, admin, settings, shippingRules] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getStoreSettings(),
    getShippingRules(),
  ]);

  /** A saved value wins; otherwise the form shows the shipped default. */
  const saved = (key: string, fallback: string) => settings[key] ?? fallback;
  const flag = (key: string, fallback: boolean) =>
    settings[key] === undefined ? fallback : settings[key] === "true";

  const t = admin.settings;
  const base = `/${locale}/admin/settings`;

  return (
    <>
      <AdminPageHeader title={t.title} subtitle={t.subtitle} />

      <nav className="flex flex-wrap gap-px">
        {tabs.map((entry) => (
          <Link
            key={entry}
            href={`${base}${entry === "store" ? "" : `?tab=${entry}`}`}
            aria-current={tab === entry ? "page" : undefined}
            className={cn(
              "border border-line px-4 py-2.5 text-label-md transition-colors",
              tab === entry
                ? "bg-primary-container font-semibold text-on-primary-container"
                : "bg-card text-on-surface-variant hover:bg-surface-high hover:text-on-surface",
            )}
          >
            {t.tabs[entry]}
          </Link>
        ))}
      </nav>

      {tab === "store" ? (
        <Panel title={t.store.title} subtitle={t.saved}>
          <ActionForm
            className="grid gap-4 sm:grid-cols-2"
            action={saveSettings}
            successTitle={dictionary.common.toast.saved}
            errorMessages={dictionary.common.actionErrors}
            fallbackError={dictionary.common.toast.actionFailed}
          >
            <input type="hidden" name="section" value="store" />
            <Field label={t.store.nameAr} htmlFor="nameAr">
              <Input id="nameAr" name="nameAr" defaultValue={saved("nameAr", "نُقطة")} />
            </Field>
            <Field label={t.store.nameEn} htmlFor="nameEn">
              <Input
                id="nameEn"
                name="nameEn"
                dir="ltr"
                defaultValue={saved("nameEn", "Noqta")}
              />
            </Field>
            <Field label={t.store.taglineAr} htmlFor="taglineAr">
              <Input
                id="taglineAr"
                name="taglineAr"
                defaultValue={saved("taglineAr", "مكتبة ومتجر كتب")}
              />
            </Field>
            <Field label={t.store.taglineEn} htmlFor="taglineEn">
              <Input
                id="taglineEn"
                name="taglineEn"
                dir="ltr"
                defaultValue={saved("taglineEn", "Bookshop & store")}
              />
            </Field>
            <Field label={t.store.email} htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                dir="ltr"
                defaultValue={saved("email", dictionary.footer.contact.email)}
              />
            </Field>
            <Field label={t.store.phone} htmlFor="phone">
              <Input
                id="phone"
                name="phone"
                type="tel"
                dir="ltr"
                className="font-mono"
                defaultValue={saved("phone", dictionary.footer.contact.phone)}
              />
            </Field>
            <Field label={t.store.address} htmlFor="address" className="sm:col-span-2">
              <Input
                id="address"
                name="address"
                defaultValue={saved("address", dictionary.footer.contact.address)}
              />
            </Field>
            <Field label={t.store.currency} htmlFor="currency">
              <Select id="currency" name="currency" defaultValue={saved("currency", "IQD")}>
                <option value="IQD">IQD — د.ع</option>
              </Select>
            </Field>
            <Field label={t.store.defaultLocale} htmlFor="defaultLocale">
              <Select
                id="defaultLocale"
                name="defaultLocale"
                defaultValue={saved("defaultLocale", "ar")}
              >
                {locales.map((entry) => (
                  <option key={entry} value={entry}>
                    {localeNames[entry]}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="sm:col-span-2">
              <Button type="submit">{admin.common.saveChanges}</Button>
            </div>
          </ActionForm>
        </Panel>
      ) : null}

      {tab === "shipping" ? (
        <Panel title={t.shipping.title} subtitle={t.saved}>
          <ActionForm
            className="grid gap-4 sm:grid-cols-2"
            action={saveSettings}
            successTitle={dictionary.common.toast.saved}
            errorMessages={dictionary.common.actionErrors}
            fallbackError={dictionary.common.toast.actionFailed}
          >
            <input type="hidden" name="section" value="shipping" />
            <Field label={t.shipping.standardCost} htmlFor="standardCost">
              <Input
                id="standardCost"
                name="standardCost"
                type="number"
                dir="ltr"
                step={500}
                className="font-mono"
                defaultValue={shippingRules.standardCost}
              />
            </Field>
            <Field label={t.shipping.expressCost} htmlFor="expressCost">
              <Input
                id="expressCost"
                name="expressCost"
                type="number"
                dir="ltr"
                step={500}
                className="font-mono"
                defaultValue={shippingRules.expressCost}
              />
            </Field>
            <Field label={t.shipping.freeThreshold} htmlFor="freeThreshold">
              <Input
                id="freeThreshold"
                name="freeThreshold"
                type="number"
                dir="ltr"
                step={1000}
                className="font-mono"
                defaultValue={shippingRules.freeThreshold}
              />
            </Field>
            <Field label={t.shipping.estimatedDays} htmlFor="estimatedDays">
              <Input
                id="estimatedDays"
                name="estimatedDays"
                dir="ltr"
                className="font-mono"
                defaultValue={shippingRules.estimatedDays}
              />
            </Field>

            <div className="space-y-4 sm:col-span-2">
              <Checkbox
                id="enablePickup"
                name="enablePickup"
                defaultChecked={shippingRules.enablePickup}
                label={t.shipping.enablePickup}
              />
              <Button type="submit">{admin.common.saveChanges}</Button>
            </div>
          </ActionForm>
        </Panel>
      ) : null}

      {tab === "payments" ? (
        <Panel title={t.payments.title} subtitle={t.saved}>
          <ActionForm
            className="space-y-3"
            action={saveSettings}
            successTitle={dictionary.common.toast.saved}
            errorMessages={dictionary.common.actionErrors}
            fallbackError={dictionary.common.toast.actionFailed}
          >
            <input type="hidden" name="section" value="payments" />
            <RadioCard
              id="pay-cod"
              name="paymentDefault"
              value="cod"
              defaultChecked={saved("paymentDefault", "cod") === "cod"}
              title={t.payments.cod}
              note={t.payments.codNote}
              trailing={
                <span className="label-mono border border-line bg-success px-2 py-1 text-white">
                  {admin.common.active}
                </span>
              }
            />
            <RadioCard
              id="pay-wallet"
              name="paymentDefault"
              value="wallet"
              defaultChecked={saved("paymentDefault", "cod") === "wallet"}
              title={t.payments.wallet}
              note={t.payments.walletNote}
              trailing={
                <span className="label-mono border border-line bg-surface-high px-2 py-1 text-on-surface">
                  {admin.common.active}
                </span>
              }
            />
            <RadioCard
              id="pay-card"
              name="paymentDefault"
              value="card"
              disabled
              title={t.payments.card}
              note={t.payments.cardNote}
              trailing={
                <span className="label-mono border border-outline px-2 py-1 text-muted">
                  {admin.common.inactive}
                </span>
              }
            />

            <Button type="submit">{admin.common.saveChanges}</Button>
          </ActionForm>
        </Panel>
      ) : null}

      {tab === "account" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title={t.account.title}>
            <ActionForm
            className="space-y-4"
            action={saveSettings}
            successTitle={dictionary.common.toast.saved}
            errorMessages={dictionary.common.actionErrors}
            fallbackError={dictionary.common.toast.actionFailed}
          >
              <input type="hidden" name="section" value="adminProfile" />
              <Field label={t.account.name} htmlFor="adminName">
                <Input
                  id="adminName"
                  name="adminName"
                  defaultValue={saved("adminName", "نُقطة")}
                />
              </Field>
              <Field label={t.account.email} htmlFor="adminEmail">
                <Input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  dir="ltr"
                  defaultValue={saved("adminEmail", "admin@noqta.iq")}
                />
              </Field>
              <Field label={t.account.phone} htmlFor="adminPhone">
                <Input
                  id="adminPhone"
                  name="adminPhone"
                  type="tel"
                  dir="ltr"
                  className="font-mono"
                  defaultValue={saved("adminPhone", "+964 770 000 0000")}
                />
              </Field>
              <Button type="submit">{admin.common.saveChanges}</Button>
            </ActionForm>

            <div className="border-t border-line pt-4">
              <ChangePasswordForm
                labels={{
                  current: t.account.currentPassword,
                  next: t.account.newPassword,
                  submit: t.account.changePassword,
                  success: dictionary.common.toast.saved,
                  tooShort: dictionary.common.validation.minLength.replace("{n}", "8"),
                  failure: dictionary.common.toast.actionFailed,
                }}
              />
            </div>
          </Panel>

          <Panel title={t.account.notifications} subtitle={t.saved}>
            <ActionForm
            className="space-y-3"
            action={saveSettings}
            successTitle={dictionary.common.toast.saved}
            errorMessages={dictionary.common.actionErrors}
            fallbackError={dictionary.common.toast.actionFailed}
          >
              <input type="hidden" name="section" value="adminNotifications" />
              <Checkbox
                id="notifyOrders"
                name="notifyOrders"
                defaultChecked={flag("notifyOrders", true)}
                label={t.account.notifyOrders}
              />
              <Checkbox
                id="notifyReviews"
                name="notifyReviews"
                defaultChecked={flag("notifyReviews", true)}
                label={t.account.notifyReviews}
              />
              <Checkbox
                id="notifyStock"
                name="notifyStock"
                defaultChecked={flag("notifyStock", false)}
                label={t.account.notifyStock}
              />

              <Button type="submit">{admin.common.saveChanges}</Button>
            </ActionForm>
          </Panel>
        </div>
      ) : null}
    </>
  );
}
