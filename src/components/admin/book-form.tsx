import Link from "next/link";

import { CoverField } from "@/components/admin/cover-field";
import { Panel } from "@/components/admin/panel";
import { BookCover } from "@/components/book/book-cover";
import { Button, buttonStyles } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/config";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import type {
  Author,
  BookTag,
  BookWithRelations,
  CategoryNode,
  Publisher,
} from "@/types";
import { ActionForm } from "@/components/ui/action-form";
import { deleteBook, saveBook } from "@/app/actions/admin";
import { indentFor } from "@/lib/category-tree";

interface BookFormProps {
  locale: Locale;
  admin: AdminDictionary;
  /** Storefront dictionary — reused for tag and cover-type labels. */
  dictionary: Dictionary;
  authors: Author[];
  /** The tree in order; the select indents each branch under its parent. */
  categories: CategoryNode[];
  publishers: Publisher[];
  /** Absent when creating a new title. */
  book?: BookWithRelations;
  cancelHref: string;
}

const tagOptions: BookTag[] = ["bestseller", "new", "featured", "award"];

/** One form serves both "add book" and "edit book". */
export function BookForm({
  locale,
  admin,
  dictionary,
  authors,
  categories,
  publishers,
  book,
  cancelHref,
}: BookFormProps) {
  const t = admin.bookForm;
  const isEdit = Boolean(book);

  return (
    <ActionForm
      className="grid gap-4 lg:grid-cols-12"
      action={saveBook}
      successTitle={
        isEdit ? dictionary.common.toast.saved : dictionary.common.toast.bookPublished
      }
      fallbackError={dictionary.common.toast.actionFailed}
          errorMessages={{
            forbidden: dictionary.common.actionErrors.forbidden,
            duplicate: dictionary.common.actionErrors.duplicate,
            negativeStock: dictionary.common.actionErrors.negativeStock,
            saveFailed: dictionary.common.actionErrors.saveFailed,
            missingTitle: dictionary.common.actionErrors.missingTitle,
            missingRelation: dictionary.common.actionErrors.missingRelation,
            invalidImage: dictionary.common.actionErrors.invalidImage,
            imageTooLarge: dictionary.common.actionErrors.imageTooLarge,
            uploadFailed: dictionary.common.actionErrors.uploadFailed,
          }}
    >
      {book ? <input type="hidden" name="bookId" value={book.id} /> : null}

      <div className="space-y-4 lg:col-span-8">
        <Panel title={t.sections.basic}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.fields.titleAr} htmlFor="titleAr">
              <Input id="titleAr" name="titleAr" defaultValue={book?.title.ar} required />
            </Field>
            <Field label={t.fields.author} htmlFor="authorId">
              <Select id="authorId" name="authorId" defaultValue={book?.authorId ?? ""}>
                <option value="" disabled>
                  —
                </option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name[locale]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.fields.category} htmlFor="categoryId">
              <Select
                id="categoryId"
                name="categoryId"
                defaultValue={book?.categoryId ?? ""}
              >
                <option value="" disabled>
                  —
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {indentFor(category.depth)}
                    {category.name[locale]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Panel>

        <Panel title={t.sections.description}>
          <div className="space-y-4">
            <Field label={t.fields.descriptionAr} htmlFor="descriptionAr">
              <Textarea
                id="descriptionAr"
                name="descriptionAr"
                rows={4}
                defaultValue={book?.description.ar}
              />
            </Field>
          </div>
        </Panel>

        <Panel title={t.sections.publishing}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.fields.publisher} htmlFor="publisherId">
              <Select
                id="publisherId"
                name="publisherId"
                defaultValue={book?.publisherId ?? ""}
              >
                <option value="" disabled>
                  —
                </option>
                {publishers.map((publisher) => (
                  <option key={publisher.id} value={publisher.id}>
                    {publisher.name[locale]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.fields.publishedYear} htmlFor="publishedYear">
              <Input
                id="publishedYear"
                name="publishedYear"
                type="number"
                dir="ltr"
                data-numeric
                defaultValue={book?.publishedYear}
              />
            </Field>
            <Field label={t.fields.pages} htmlFor="pages">
              <Input
                id="pages"
                name="pages"
                type="number"
                dir="ltr"
                data-numeric
                defaultValue={book?.pages}
              />
            </Field>
          </div>
        </Panel>
      </div>

      <div className="space-y-4 lg:col-span-4">
        <Panel title={t.sections.media}>
          <CoverField labels={t.upload} errors={dictionary.common.actionErrors}>
            <BookCover
              title={book?.title[locale] ?? admin.books.title}
              author={book?.author.name[locale] ?? admin.brand.name}
              seed={book?.slug ?? "new-book"}
              src={book?.coverUrl}
              sizes="8rem"
              className="rounded-lg elevation-sm"
            />
          </CoverField>
        </Panel>

        <Panel title={t.sections.pricing}>
          <div className="space-y-4">
            <Field label={t.fields.price} htmlFor="price">
              <Input
                id="price"
                name="price"
                type="number"
                dir="ltr"
                step={500}
                data-numeric
                defaultValue={book?.price}
                required
              />
            </Field>
            <Field
              label={t.fields.compareAtPrice}
              htmlFor="compareAtPrice"
              hint={t.hints.compareAtPrice}
            >
              <Input
                id="compareAtPrice"
                name="compareAtPrice"
                type="number"
                dir="ltr"
                step={500}
                data-numeric
                defaultValue={book?.compareAtPrice}
              />
            </Field>
          </div>
        </Panel>

        <Panel title={t.sections.inventory}>
          <Field label={t.fields.stock} htmlFor="stock">
            <Input
              id="stock"
              name="stock"
              type="number"
              dir="ltr"
              min={0}
              data-numeric
              defaultValue={book?.stock}
            />
          </Field>
        </Panel>

        <Panel title={t.sections.organisation}>
          <div className="space-y-2.5">
            {tagOptions.map((tag) => (
              <Checkbox
                key={tag}
                id={`tag-${tag}`}
                name="tags"
                value={tag}
                defaultChecked={book?.tags.includes(tag)}
                label={dictionary.common.tags[tag]}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card p-4 lg:col-span-12">
        <Button type="submit" size="lg">
          {isEdit ? admin.common.saveChanges : t.actions.publish}
        </Button>
        <Button type="button" variant="secondary" size="lg">
          {t.actions.saveDraft}
        </Button>
        <Link
          href={cancelHref}
          className={buttonStyles({ variant: "subtle", size: "lg" })}
        >
          {admin.common.cancel}
        </Link>

        {isEdit ? (
          <ConfirmDialog
            variant="button"
            className="ms-auto"
            action={book ? deleteBook.bind(null, book.id) : undefined}
            fallbackError={dictionary.common.toast.actionFailed}
            errorMessages={{
              inUse: dictionary.common.actionErrors.inUse,
              forbidden: dictionary.common.actionErrors.forbidden,
              notFound: dictionary.common.actionErrors.notFound,
              deleteFailed: dictionary.common.actionErrors.deleteFailed,
            }}
            itemName={book?.title[locale]}
            labels={{
              title: dictionary.common.confirm.deleteTitle,
              description: dictionary.common.confirm.deleteDescription,
              confirm: dictionary.common.confirm.confirm,
              cancel: dictionary.common.confirm.cancel,
              done: dictionary.common.toast.deleted,
              trigger: t.actions.delete,
            }}
          />
        ) : null}
      </div>
    </ActionForm>
  );
}
