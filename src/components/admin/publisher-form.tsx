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

      <div className="grid gap-4 sm:grid-cols-2">
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

      <Button type="submit" fullWidth>
        {isEdit ? t.save : admin.publishers.add}
      </Button>
    </ActionForm>
  );
}
