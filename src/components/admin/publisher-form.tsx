import { savePublisher } from "@/app/actions/admin";
import { CoverField } from "@/components/admin/cover-field";
import { PublisherMark } from "@/components/publisher/publisher-card";
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

/**
 * One form for adding a publishing house and for editing an existing one. An
 * add empties the form, which sits beside the list and is used again.
 *
 * Both take a logo, kept a square PNG like a subject's picture. The edit page
 * shows the current one and can take it off; the add form can drop a picked
 * file before it is saved, and forgets it when the form is emptied.
 */
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
      resetOnSuccess={!isEdit}
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

      <Field label={t.upload.label} htmlFor="coverImage" optional={dictionary.common.optional}>
        <CoverField
          kind="icon"
          labels={t.upload}
          errors={dictionary.common.actionErrors}
          hasCover={Boolean(publisher?.logoUrl)}
          clearLabel={t.upload.clear}
        >
          <PublisherMark
            publisher={publisher ?? { slug: "", logoUrl: null }}
            className="aspect-square w-full"
            iconClassName="size-1/3"
          />
        </CoverField>
      </Field>

      <Button type="submit" fullWidth>
        {isEdit ? t.save : admin.publishers.add}
      </Button>
    </ActionForm>
  );
}
