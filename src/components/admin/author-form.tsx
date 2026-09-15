import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActionForm } from "@/components/ui/action-form";
import { saveAuthor } from "@/app/actions/admin";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import type { Author } from "@/types";

interface AuthorFormProps {
  admin: AdminDictionary;
  dictionary: Dictionary;
  /** Absent when creating a new author. */
  author?: Author;
}

/** One form for adding an author and for editing an existing one. */
export function AuthorForm({ admin, dictionary, author }: AuthorFormProps) {
  const t = admin.authors.form;
  const isEdit = Boolean(author);

  return (
    <ActionForm
      className="space-y-4"
      action={saveAuthor}
      successTitle={
        isEdit ? dictionary.common.toast.saved : dictionary.common.toast.itemAdded
      }
      fallbackError={dictionary.common.toast.actionFailed}
          errorMessages={{
            forbidden: dictionary.common.actionErrors.forbidden,
            duplicate: dictionary.common.actionErrors.duplicate,
            missingTitle: dictionary.common.actionErrors.missingTitle,
            missingRelation: dictionary.common.actionErrors.missingRelation,
          }}
    >
      {author ? <input type="hidden" name="authorId" value={author.id} /> : null}

      <Field label={t.nameAr} htmlFor="nameAr">
        <Input id="nameAr" name="nameAr" defaultValue={author?.name.ar} required />
      </Field>
      <Field label={t.subjectAr} htmlFor="subjectAr">
        <Input
          id="subjectAr"
          name="subjectAr"
          defaultValue={author?.subject?.ar}
          placeholder={t.subjectPlaceholder}
        />
      </Field>
      <Field label={t.bioAr} htmlFor="bioAr">
        <Textarea id="bioAr" name="bioAr" rows={3} defaultValue={author?.bio.ar} />
      </Field>

      <Button type="submit" fullWidth>
        {isEdit ? t.save : admin.authors.add}
      </Button>
    </ActionForm>
  );
}
