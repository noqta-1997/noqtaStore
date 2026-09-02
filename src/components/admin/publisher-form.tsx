import { savePublisher } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import type { Publisher } from "@/types";

interface PublisherFormProps {
  admin: AdminDictionary;
  dictionary: Dictionary;
  /** Absent when creating a new publisher. */
  publisher?: Publisher;
}

/** One form for adding a publishing house and for editing an existing one. */
export function PublisherForm({ admin, dictionary, publisher }: PublisherFormProps) {
  const t = admin.publishers.form;
  const isEdit = Boolean(publisher);

  return (
    <ActionForm
      className="space-y-4"
      action={savePublisher}
      successTitle={
        isEdit ? dictionary.common.toast.saved : dictionary.common.toast.itemAdded
      }
      fallbackError={dictionary.common.toast.actionFailed}
      errorMessages={dictionary.common.actionErrors}
    >
      {publisher ? (
        <input type="hidden" name="publisherId" value={publisher.id} />
      ) : null}

      <Field label={t.nameAr} htmlFor="nameAr">
        <Input id="nameAr" name="nameAr" defaultValue={publisher?.name.ar} required />
      </Field>
      <Field label={t.nameEn} htmlFor="nameEn">
        <Input
          id="nameEn"
          name="nameEn"
          dir="ltr"
          defaultValue={publisher?.name.en}
          required
        />
      </Field>
      <Field label={t.slug} htmlFor="slug" optional={dictionary.common.optional}>
        <Input
          id="slug"
          name="slug"
          dir="ltr"
          data-numeric
          defaultValue={publisher?.slug}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.countryAr}
          htmlFor="countryAr"
          optional={dictionary.common.optional}
        >
          <Input id="countryAr" name="countryAr" defaultValue={publisher?.country.ar} />
        </Field>
        <Field
          label={t.countryEn}
          htmlFor="countryEn"
          optional={dictionary.common.optional}
        >
          <Input
            id="countryEn"
            name="countryEn"
            dir="ltr"
            defaultValue={publisher?.country.en}
          />
        </Field>
        <Field
          label={t.foundedYear}
          htmlFor="foundedYear"
          optional={dictionary.common.optional}
        >
          <Input
            id="foundedYear"
            name="foundedYear"
            type="number"
            dir="ltr"
            min={1400}
            max={new Date().getFullYear()}
            data-numeric
            defaultValue={publisher?.foundedYear ?? ""}
          />
        </Field>
      </div>

      <Field
        label={t.descriptionAr}
        htmlFor="descriptionAr"
        optional={dictionary.common.optional}
      >
        <Textarea
          id="descriptionAr"
          name="descriptionAr"
          rows={3}
          defaultValue={publisher?.description.ar}
        />
      </Field>
      <Field
        label={t.descriptionEn}
        htmlFor="descriptionEn"
        optional={dictionary.common.optional}
      >
        <Textarea
          id="descriptionEn"
          name="descriptionEn"
          rows={3}
          dir="ltr"
          defaultValue={publisher?.description.en}
        />
      </Field>

      <Button type="submit" fullWidth>
        {isEdit ? t.save : admin.publishers.add}
      </Button>
    </ActionForm>
  );
}
