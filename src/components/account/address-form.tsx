import Link from "next/link";

import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { governorates } from "@/lib/constants";
import type { Address } from "@/types";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteAddress, saveAddress } from "@/app/actions/account";

interface AddressFormProps {
  locale: Locale;
  dictionary: Dictionary;
  /** Absent when adding a new address. */
  address?: Address;
  cancelHref: string;
}

/** One form for both adding and editing a saved delivery address. */
export function AddressForm({
  locale,
  dictionary,
  address,
  cancelHref,
}: AddressFormProps) {
  const t = dictionary.account.addresses.form;
  const checkout = dictionary.checkout;
  const isEdit = Boolean(address);

  return (
    <ActionForm
      className="space-y-6 rounded-xl border border-line bg-card p-5 sm:p-6"
      action={saveAddress}
      successTitle={dictionary.common.toast.addressSaved}
      fallbackError={dictionary.common.toast.actionFailed}
      redirectTo={cancelHref}
      errorMessages={{
        missingAddress: dictionary.common.toast.missingAddress,
        unauthenticated: dictionary.common.toast.signInRequired,
      }}
    >
      {address ? <input type="hidden" name="addressId" value={address.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.label}
          htmlFor="label"
          hint={t.labelHint}
          className="sm:col-span-2"
        >
          <Input id="label" name="label" defaultValue={address?.label[locale]} required />
        </Field>

        <Field label={checkout.fullName} htmlFor="fullName">
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            defaultValue={address?.fullName}
            required
          />
        </Field>

        <Field label={checkout.phone} htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            data-numeric
            defaultValue={address?.phone}
            required
          />
        </Field>

        <Field label={checkout.governorate} htmlFor="governorate">
          <Select
            id="governorate"
            name="governorate"
            defaultValue={address?.governorate.en ?? ""}
            required
          >
            <option value="" disabled>
              {checkout.selectGovernorate}
            </option>
            {governorates.map((item) => (
              <option key={item.en} value={item.en}>
                {item[locale]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={checkout.city} htmlFor="city">
          <Input
            id="city"
            name="city"
            autoComplete="address-level2"
            defaultValue={address?.city[locale]}
            required
          />
        </Field>

        <Field label={checkout.addressLine} htmlFor="line" className="sm:col-span-2">
          <Textarea id="line" name="line" rows={3} defaultValue={address?.line[locale]} />
        </Field>
      </div>

      <Checkbox
        id="isDefault"
        name="isDefault"
        defaultChecked={address?.isDefault}
        label={t.makeDefault}
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-line-divider pt-5">
        <Button type="submit" size="lg">
          {t.save}
        </Button>
        <Link href={cancelHref} className={buttonStyles({ variant: "subtle", size: "lg" })}>
          {dictionary.common.cancel}
        </Link>

        {isEdit ? (
          <ConfirmDialog
            variant="button"
            className="ms-auto"
            itemName={address?.label[locale]}
            action={address ? deleteAddress.bind(null, address.id) : undefined}
            fallbackError={dictionary.common.toast.actionFailed}
            labels={{
              title: dictionary.common.confirm.deleteTitle,
              description: dictionary.common.confirm.deleteDescription,
              confirm: dictionary.common.confirm.confirm,
              cancel: dictionary.common.confirm.cancel,
              done: dictionary.common.toast.deleted,
              trigger: t.delete,
            }}
          />
        ) : null}
      </div>
    </ActionForm>
  );
}
