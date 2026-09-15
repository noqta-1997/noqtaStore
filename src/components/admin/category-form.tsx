import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ActionForm } from "@/components/ui/action-form";
import { categoryIconNames } from "@/components/ui/category-icon";
import { saveCategory } from "@/app/actions/admin";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import { indentFor, isWithin } from "@/lib/category-tree";
import type { CategoryNode } from "@/types";

interface CategoryFormProps {
  admin: AdminDictionary;
  dictionary: Dictionary;
  /** The whole tree in order — what the parent control offers. */
  categories: CategoryNode[];
  /** Absent when creating a new category. */
  category?: CategoryNode;
  /** Pre-selects the parent when the form opens from a branch's "add under" link. */
  defaultParentId?: string;
}

/**
 * One form for adding a category and for editing an existing one. Where the
 * branch sits is part of it: the parent it hangs under and its place among
 * its siblings. A branch being edited is left out of the parent list along
 * with everything under it — it cannot hang from its own descendants.
 */
export function CategoryForm({
  admin,
  dictionary,
  categories,
  category,
  defaultParentId,
}: CategoryFormProps) {
  const t = admin.categories.form;
  const isEdit = Boolean(category);
  const parents = category
    ? categories.filter((node) => !isWithin(category, node.id))
    : categories;

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
        invalidParent: dictionary.common.actionErrors.invalidParent,
      }}
    >
      {category ? <input type="hidden" name="categoryId" value={category.id} /> : null}

      <Field label={t.nameAr} htmlFor="nameAr">
        <Input id="nameAr" name="nameAr" defaultValue={category?.name.ar} required />
      </Field>
      <Field label={t.parent} htmlFor="parentId">
        <Select
          id="parentId"
          name="parentId"
          defaultValue={category?.parentId ?? defaultParentId ?? ""}
        >
          <option value="">{t.topLevel}</option>
          {parents.map((node) => (
            <option key={node.id} value={node.id}>
              {indentFor(node.depth)}
              {node.name.ar}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.sortOrder} htmlFor="sortOrder" hint={t.sortOrderHint}>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={category?.sortOrder ?? 0}
            data-numeric
          />
        </Field>
        <Field label={t.icon} htmlFor="icon">
          <Select id="icon" name="icon" defaultValue={category?.icon ?? categoryIconNames[0]}>
            {categoryIconNames.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </Select>
        </Field>
      </div>
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
