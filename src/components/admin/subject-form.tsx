import { saveSubject } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { categoryIconNames } from "@/components/ui/category-icon";
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

      <Field label={t.icon} htmlFor="icon">
        <Select id="icon" name="icon" defaultValue={subject?.icon ?? categoryIconNames[0]}>
          {categoryIconNames.map((icon) => (
            <option key={icon} value={icon}>
              {icon}
            </option>
          ))}
        </Select>
      </Field>

      <Button type="submit" fullWidth>
        {isEdit ? t.save : admin.subjects.add}
      </Button>
    </ActionForm>
  );
}
