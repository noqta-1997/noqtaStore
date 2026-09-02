import { ImagePlus } from "lucide-react";
import Link from "next/link";

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
  Category,
  Publisher,
} from "@/types";
import { ActionForm } from "@/components/ui/action-form";
import { deleteBook, saveBook } from "@/app/actions/admin";

interface BookFormProps {
  locale: Locale;
  admin: AdminDictionary;
  /** Storefront dictionary — reused for tag and cover-type labels. */
  dictionary: Dictionary;
  authors: Author[];
  categories: Category[];
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
            missingTitle: dictionary.common.actionErrors.missingTitle,
            missingRelation: dictionary.common.actionErrors.missingRelation,
          }}
    >
      {book ? <input type="hidden" name="bookId" value={book.id} /> : null}

      <div className="space-y-4 lg:col-span-8">
        <Panel title={t.sections.basic}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.fields.titleAr} htmlFor="titleAr">
              <Input id="titleAr" name="titleAr" defaultValue={book?.title.ar} required />
            </Field>
            <Field label={t.fields.titleEn} htmlFor="titleEn">
              <Input
                id="titleEn"
                name="titleEn"
                dir="ltr"
                defaultValue={book?.title.en}
                required
              />
            </Field>
            <Field
              label={t.fields.slug}
              htmlFor="slug"
              hint={t.hints.slug}
              className="sm:col-span-2"
            >
              <Input
                id="slug"
                name="slug"
                dir="ltr"
                className="font-mono"
                defaultValue={book?.slug}
              />
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
            <Field label={t.fields.descriptionEn} htmlFor="descriptionEn">
              <Textarea
                id="descriptionEn"
                name="descriptionEn"
                rows={4}
                dir="ltr"
                defaultValue={book?.description.en}
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
                className="font-mono"
                defaultValue={book?.publishedYear}
              />
            </Field>
            <Field label={t.fields.isbn} htmlFor="isbn" hint={t.hints.isbn}>
              <Input
                id="isbn"
                name="isbn"
                dir="ltr"
                inputMode="numeric"
                className="font-mono"
                defaultValue={book?.isbn}
              />
            </Field>
            <Field label={t.fields.pages} htmlFor="pages">
              <Input
                id="pages"
                name="pages"
                type="number"
                dir="ltr"
                className="font-mono"
                defaultValue={book?.pages}
              />
            </Field>
            <Field label={t.fields.coverType} htmlFor="coverType">
              <Select
                id="coverType"
                name="coverType"
                defaultValue={book?.coverType ?? "paperback"}
              >
                <option value="paperback">{dictionary.books.paperback}</option>
                <option value="hardcover">{dictionary.books.hardcover}</option>
              </Select>
            </Field>
            <Field label={t.fields.weight} htmlFor="weightGrams">
              <Input
                id="weightGrams"
                name="weightGrams"
                type="number"
                dir="ltr"
                className="font-mono"
                defaultValue={book?.weightGrams}
              />
            </Field>
          </div>
        </Panel>
      </div>

      <div className="space-y-4 lg:col-span-4">
        <Panel title={t.sections.media}>
          <div className="space-y-3">
            <div className="mx-auto w-32">
              <BookCover
                title={book?.title[locale] ?? admin.books.title}
                author={book?.author.name[locale] ?? admin.brand.name}
                seed={book?.slug ?? "new-book"}
                src={book?.coverUrl}
                sizes="8rem"
                className="border border-line"
              />
            </div>

            <label
              htmlFor="coverImage"
              className="flex cursor-pointer flex-col items-center gap-2 border border-dashed border-outline p-4 text-center transition-colors hover:bg-state-hover"
            >
              <ImagePlus aria-hidden className="size-5 text-primary" strokeWidth={2} />
              <span className="text-label-md text-on-surface">{t.upload.button}</span>
              <span className="text-label-sm text-muted">{t.upload.hint}</span>
              <input id="coverImage" name="coverImage" type="file" accept="image/*" className="sr-only" />
            </label>

            <p className="text-label-sm text-muted">{t.upload.placeholder}</p>
          </div>
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
                className="font-mono"
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
                className="font-mono"
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
              className="font-mono"
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

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-card p-4 lg:col-span-12">
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
