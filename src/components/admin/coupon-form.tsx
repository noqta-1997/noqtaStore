import { saveCoupon } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import type { Coupon } from "@/types";

interface CouponFormProps {
  admin: AdminDictionary;
  dictionary: Dictionary;
  /** Absent when creating a new code. */
  coupon?: Coupon;
}

/** One form for adding a discount code and for editing an existing one. */
export function CouponForm({ admin, dictionary, coupon }: CouponFormProps) {
  const t = admin.coupons.form;
  const isEdit = Boolean(coupon);

  return (
    <ActionForm
      className="space-y-4"
      action={saveCoupon}
      successTitle={
        isEdit ? dictionary.common.toast.saved : dictionary.common.toast.itemAdded
      }
      fallbackError={dictionary.common.toast.actionFailed}
      errorMessages={dictionary.common.actionErrors}
    >
      {coupon ? <input type="hidden" name="couponId" value={coupon.id} /> : null}

      <Field label={t.code} htmlFor="code" hint={t.codeHint}>
        <Input
          id="code"
          name="code"
          dir="ltr"
          required
          maxLength={32}
          className="uppercase"
          defaultValue={coupon?.code}
        />
      </Field>

      <Field label={t.type} htmlFor="type">
        <Select id="type" name="type" defaultValue={coupon?.type ?? "percentage"}>
          <option value="percentage">{admin.coupons.types.percentage}</option>
          <option value="fixed">{admin.coupons.types.fixed}</option>
        </Select>
      </Field>

      <Field
        label={t.value}
        htmlFor="value"
        hint={`${t.valueHintPercentage} / ${t.valueHintFixed}`}
      >
        <Input
          id="value"
          name="value"
          type="number"
          dir="ltr"
          min={1}
          required
          data-numeric
          defaultValue={coupon?.value}
        />
      </Field>

      <Field label={t.minSubtotal} htmlFor="minSubtotal">
        <Input
          id="minSubtotal"
          name="minSubtotal"
          type="number"
          dir="ltr"
          min={0}
          step={1000}
          data-numeric
          defaultValue={coupon?.minSubtotal ?? 0}
        />
      </Field>

      <Field
        label={t.usageLimit}
        htmlFor="usageLimit"
        hint={t.usageLimitHint}
        optional={dictionary.common.optional}
      >
        <Input
          id="usageLimit"
          name="usageLimit"
          type="number"
          dir="ltr"
          min={1}
          data-numeric
          defaultValue={coupon?.usageLimit ?? ""}
        />
      </Field>

      <Field
        label={t.expiresAt}
        htmlFor="expiresAt"
        optional={dictionary.common.optional}
      >
        <Input
          id="expiresAt"
          name="expiresAt"
          type="date"
          dir="ltr"
          defaultValue={coupon?.expiresAt}
        />
      </Field>

      <Checkbox
        id="active"
        name="active"
        defaultChecked={coupon?.active ?? true}
        label={t.active}
      />

      <Button type="submit" fullWidth>
        {isEdit ? t.save : admin.coupons.add}
      </Button>
    </ActionForm>
  );
}
