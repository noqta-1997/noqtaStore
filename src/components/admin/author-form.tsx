import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ActionForm } from "@/components/ui/action-form";
import { saveAuthor } from "@/app/actions/admin";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import { indentFor } from "@/lib/category-tree";
import type { Author, CategoryNode } from "@/types";

interface AuthorFormProps {
  admin: AdminDictionary;
  dictionary: Dictionary;
  /** The whole category tree in order — what the subject control offers. */
  categories: CategoryNode[];
  /** Absent when creating a new author. */
  author?: Author;
}

/**
 * One form for adding an author and for editing an existing one. The subject
 * is picked from the school-books category tree, indented the way the
 * category form's parent control is, so a branch added there is offered here.
 */
export function AuthorForm({ admin, dictionary, categories, author }: AuthorFormProps) {
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
      <Field label={t.subject} htmlFor="subjectId" hint={t.subjectHint}>
        <Select id="subjectId" name="subjectId" defaultValue={author?.subjectId ?? ""}>
          <option value="">{t.subjectNone}</option>
          {categories.map((node) => (
            <option key={node.id} value={node.id}>
              {indentFor(node.depth)}
              {node.name.ar}
            </option>
          ))}
        </Select>
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
