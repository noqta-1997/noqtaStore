import { PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { HomeSectionToggle } from "@/components/admin/home-section-toggle";
import { Panel } from "@/components/admin/panel";
import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ListRow } from "@/components/ui/list-row";
import { RadioCard } from "@/components/ui/radio-card";
import { Select } from "@/components/ui/select";
import { getHomeSections, getShippingRules, getStoreSettings } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import { HOME_SECTIONS, type HomeSection } from "@/lib/home-sections";
import { readParam, type SearchParamsRecord } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { ActionForm } from "@/components/ui/action-form";
import { saveSettings } from "@/app/actions/admin";

interface SettingsPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const admin = await getAdminDictionary(defaultLocale);

  return { title: `${admin.settings.title} — ${admin.brand.panel}` };
}

const tabs = ["store", "home", "shipping", "payments", "account"] as const;
type Tab = (typeof tabs)[number];

/** The sections whose copy and content have an edit page so far. */
const editableSections: readonly HomeSection[] = ["hero", "features", "bestsellers", "categories"];

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const locale = defaultLocale;

  const rawTab = readParam(await searchParams, "tab");
  const tab = (tabs.includes(rawTab as Tab) ? rawTab : "store") as Tab;

  const [dictionary, admin, settings, shippingRules, homeSections] =
    await Promise.all([
      getDictionary(locale),
      getAdminDictionary(locale),
      getStoreSettings(),
      getShippingRules(),
      getHomeSections(),
    ]);

  /** A saved value wins; otherwise the form shows the shipped default. */
  const saved = (key: string, fallback: string) => settings[key] ?? fallback;
  const flag = (key: string, fallback: boolean) =>
    settings[key] === undefined ? fallback : settings[key] === "true";

  const t = admin.settings;
  const base = `/admin/settings`;

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
              "rounded-full border border-line px-4 py-2 text-label-md transition-colors duration-100 ease-fluent",
              tab === entry
                ? "bg-primary-container font-semibold text-on-primary-container"
                : "bg-card text-on-surface-variant hover:bg-state-hover hover:text-on-surface",
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
            <Field label={t.store.taglineAr} htmlFor="taglineAr">
              <Input
                id="taglineAr"
                name="taglineAr"
                defaultValue={saved("taglineAr", "مكتبة ومتجر كتب")}
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
                data-numeric
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

            <div className="sm:col-span-2">
              <Button type="submit">{admin.common.saveChanges}</Button>
            </div>
          </ActionForm>
        </Panel>
      ) : null}

      {tab === "home" ? (
        <Panel title={t.home.title} subtitle={t.home.subtitle} flush>
          <ol className="divide-y divide-line-divider">
            {HOME_SECTIONS.map((section, index) => {
              const visible = homeSections[section];
              const copy = t.home.sections[section];

              return (
                <ListRow
                  key={section}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      className="label-mono w-6 shrink-0 pt-0.5 text-center text-muted"
                      data-numeric
                    >
                      {formatNumber(index + 1, locale)}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <p
                        className={cn(
                          "text-body-md font-semibold",
                          visible ? "text-on-surface" : "text-on-surface-variant",
                        )}
                      >
                        {copy.title}
                      </p>
                      <p className="text-label-md text-muted">{copy.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 ps-9 sm:ps-0">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-label-md font-semibold",
                        visible
                          ? "border-line bg-success text-on-success"
                          : "border-line bg-surface-low text-on-surface-variant",
                      )}
                    >
                      {visible ? t.home.visible : t.home.hidden}
                    </span>
                    {editableSections.includes(section) ? (
                      <Link
                        href={`${base}/home/${section}`}
                        aria-label={`${t.home.edit}: ${copy.title}`}
                        className={buttonStyles({ variant: "secondary", size: "sm" })}
                      >
                        <PenLine aria-hidden className="size-4" strokeWidth={1.75} />
                        {t.home.edit}
                      </Link>
                    ) : null}
                    <HomeSectionToggle
                      section={section}
                      visible={visible}
                      title={copy.title}
                      errorMessages={dictionary.common.actionErrors}
                      labels={{
                        show: t.home.show,
                        hide: t.home.hide,
                        shown: t.home.shown,
                        hidden: t.home.hiddenToast,
                        failure: dictionary.common.toast.actionFailed,
                      }}
                    />
                  </div>
                </ListRow>
              );
            })}
          </ol>
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
                data-numeric
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
                data-numeric
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
                data-numeric
                defaultValue={shippingRules.freeThreshold}
              />
            </Field>
            <Field label={t.shipping.estimatedDays} htmlFor="estimatedDays">
              <Input
                id="estimatedDays"
                name="estimatedDays"
                dir="ltr"
                data-numeric
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
                <span className="inline-flex rounded-full bg-success px-2.5 py-0.5 text-label-md font-semibold text-on-success">
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
                <span className="inline-flex rounded-full border border-line bg-surface-low px-2.5 py-0.5 text-label-md font-semibold text-on-surface">
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
                <span className="inline-flex rounded-full border border-outline px-2.5 py-0.5 text-label-md font-semibold text-muted">
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
                  data-numeric
                  defaultValue={saved("adminPhone", "+964 770 000 0000")}
                />
              </Field>
              <Button type="submit">{admin.common.saveChanges}</Button>
            </ActionForm>

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
