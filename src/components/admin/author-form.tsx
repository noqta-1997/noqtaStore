import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActionForm } from "@/components/ui/action-form";
import { saveAuthor } from "@/app/actions/admin";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import type { Author, Subject } from "@/types";

interface AuthorFormProps {
  admin: AdminDictionary;
  dictionary: Dictionary;
  /** Every subject, offered as checkboxes. */
  subjects: Subject[];
  /** Absent when creating a new author. */
  author?: Author;
}

/**
 * One form for adding an author and for editing an existing one. An add
 * empties the form, which sits beside the list and is used again.
 */
export function AuthorForm({ admin, dictionary, subjects, author }: AuthorFormProps) {
  const t = admin.authors.form;
  const isEdit = Boolean(author);
  const taught = new Set(author?.subjects?.map((subject) => subject.id));

  return (
    <ActionForm
      className="space-y-4"
      action={saveAuthor}
      successTitle={
        isEdit ? dictionary.common.toast.saved : dictionary.common.toast.itemAdded
      }
      fallbackError={dictionary.common.toast.actionFailed}
      resetOnSuccess={!isEdit}
      refreshOnErrors={["notFound", "staleSubject"]}
          errorMessages={{
            forbidden: dictionary.common.actionErrors.forbidden,
            duplicate: dictionary.common.actionErrors.duplicate,
            saveFailed: dictionary.common.actionErrors.saveFailed,
            missingTitle: dictionary.common.actionErrors.missingTitle,
            notFound: dictionary.common.actionErrors.notFound,
            staleSubject: dictionary.common.actionErrors.staleSubject,
          }}
    >
      {author ? <input type="hidden" name="authorId" value={author.id} /> : null}

      <Field label={t.nameAr} htmlFor="nameAr">
        <Input id="nameAr" name="nameAr" defaultValue={author?.name.ar} required />
      </Field>
      <Field label={t.bioAr} htmlFor="bioAr">
        <Textarea id="bioAr" name="bioAr" rows={3} defaultValue={author?.bio.ar} />
      </Field>

      {/* Any number, none included: the teachers added before subjects existed have none. */}
      <fieldset className="space-y-2">
        <legend className="flex items-baseline gap-1 text-body-md font-semibold text-on-surface">
          {t.subjects}
          <span className="font-normal text-label-md text-muted">({dictionary.common.optional})</span>
        </legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {subjects.map((subject) => (
            <Checkbox
              key={subject.id}
              id={`subject-${subject.id}`}
              name="subjectIds"
              value={subject.id}
              defaultChecked={taught.has(subject.id)}
              label={subject.name.ar}
            />
          ))}
        </div>
      </fieldset>

      <Button type="submit" fullWidth>
        {isEdit ? t.save : admin.authors.add}
      </Button>
    </ActionForm>
  );
}
