import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ActionForm } from "@/components/ui/action-form";
import { saveCategory } from "@/app/actions/admin";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import type { Category } from "@/types";

export const categoryIcons = [
  "BookOpen",
  "Landmark",
  "Sprout",
  "BrainCircuit",
  "ToyBrick",
  "Atom",
  "UserRound",
  "Feather",
];

interface CategoryFormProps {
  admin: AdminDictionary;
  dictionary: Dictionary;
  /** Absent when creating a new category. */
  category?: Category;
}

/** One form for adding a category and for editing an existing one. */
export function CategoryForm({ admin, dictionary, category }: CategoryFormProps) {
  const t = admin.categories.form;
  const isEdit = Boolean(category);

  return (
    <ActionForm
      className="space-y-4"
      action={saveCategory}
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
      {category ? <input type="hidden" name="categoryId" value={category.id} /> : null}

      <Field label={t.nameAr} htmlFor="nameAr">
        <Input id="nameAr" name="nameAr" defaultValue={category?.name.ar} required />
      </Field>
      <Field label={t.icon} htmlFor="icon">
        <Select id="icon" name="icon" defaultValue={category?.icon ?? categoryIcons[0]}>
          {categoryIcons.map((icon) => (
            <option key={icon} value={icon}>
              {icon}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t.descriptionAr} htmlFor="descriptionAr">
        <Textarea
          id="descriptionAr"
          name="descriptionAr"
          rows={3}
          defaultValue={category?.description.ar}
        />
      </Field>

      <Button type="submit" fullWidth>
        {isEdit ? t.save : admin.categories.add}
      </Button>
    </ActionForm>
  );
}
