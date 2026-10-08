import { saveSubject } from "@/app/actions/admin";
import { CoverField } from "@/components/admin/cover-field";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { CategoryIcon, categoryIconNames } from "@/components/ui/category-icon";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import type { Subject } from "@/types";

interface SubjectFormProps {
  admin: AdminDictionary;
  dictionary: Dictionary;
  /** Absent when creating a new subject. */
  subject?: Subject;
}

/**
 * One form for adding a subject and for editing an existing one: its name and
 * its picture, from the same pictures the category form offers. An add
 * empties the form, which sits beside the list and is used again.
 *
 * The add form also takes an uploaded picture, which is drawn in place of the
 * chosen one. Only there: the edit page takes none. The picker clears its
 * preview when the form is emptied after a save.
 */
export function SubjectForm({ admin, dictionary, subject }: SubjectFormProps) {
  const t = admin.subjects.form;
  const isEdit = Boolean(subject);

  return (
    <ActionForm
      className="space-y-4"
      action={saveSubject}
      successTitle={
        isEdit ? dictionary.common.toast.saved : dictionary.common.toast.itemAdded
      }
      fallbackError={dictionary.common.toast.actionFailed}
      resetOnSuccess={!isEdit}
      errorMessages={dictionary.common.actionErrors}
    >
      {subject ? <input type="hidden" name="subjectId" value={subject.id} /> : null}

      <Field label={t.nameAr} htmlFor="nameAr">
        <Input id="nameAr" name="nameAr" defaultValue={subject?.name.ar} required />
      </Field>

      <Field label={t.icon} htmlFor="icon" hint={isEdit ? undefined : t.iconHint}>
        <Select id="icon" name="icon" defaultValue={subject?.icon ?? categoryIconNames[0]}>
          {categoryIconNames.map((icon) => (
            <option key={icon} value={icon}>
              {icon}
            </option>
          ))}
        </Select>
      </Field>

      {subject ? null : (
        <Field label={t.upload.label} htmlFor="coverImage">
          <CoverField
            kind="icon"
            labels={t.upload}
            errors={dictionary.common.actionErrors}
            clearLabel={t.upload.clear}
          >
            <div className="flex aspect-square w-full items-center justify-center text-primary">
              <CategoryIcon name={categoryIconNames[0]} className="size-full" />
            </div>
          </CoverField>
        </Field>
      )}

      <Button type="submit" fullWidth>
        {isEdit ? t.save : admin.subjects.add}
      </Button>
    </ActionForm>
  );
}
