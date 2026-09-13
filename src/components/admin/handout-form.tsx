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
  Category,
  HandoutWithRelations,
  Publisher,
} from "@/types";
import { ActionForm } from "@/components/ui/action-form";
import { deleteHandout, saveHandout } from "@/app/actions/admin";

interface HandoutFormProps {
  locale: Locale;
  admin: AdminDictionary;
  /** Storefront dictionary — reused for tag and cover-type labels. */
  dictionary: Dictionary;
  authors: Author[];
  categories: Category[];
  publishers: Publisher[];
  /** Absent when creating a new handout. */
  handout?: HandoutWithRelations;
  cancelHref: string;
}

const tagOptions: BookTag[] = ["bestseller", "new", "featured", "award"];

/** One form serves both "add handout" and "edit handout" — `BookForm` over the handouts table. */
export function HandoutForm({
  locale,
  admin,
  dictionary,
  authors,
  categories,
  publishers,
  handout,
  cancelHref,
}: HandoutFormProps) {
  const t = admin.handoutForm;
  const isEdit = Boolean(handout);

  return (
    <ActionForm
      className="grid gap-4 lg:grid-cols-12"
      action={saveHandout}
      successTitle={
        isEdit ? dictionary.common.toast.saved : dictionary.common.toast.handoutPublished
      }
      fallbackError={dictionary.common.toast.actionFailed}
      errorMessages={{
        forbidden: dictionary.common.actionErrors.forbidden,
        duplicate: dictionary.common.actionErrors.duplicate,
        missingTitle: dictionary.common.actionErrors.missingTitle,
        missingRelation: dictionary.common.actionErrors.missingRelation,
      }}
    >
      {handout ? <input type="hidden" name="handoutId" value={handout.id} /> : null}

      <div className="space-y-4 lg:col-span-8">
        <Panel title={t.sections.basic}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.fields.titleAr} htmlFor="titleAr">
              <Input id="titleAr" name="titleAr" defaultValue={handout?.title.ar} required />
            </Field>
            <Field label={t.fields.author} htmlFor="authorId">
              <Select id="authorId" name="authorId" defaultValue={handout?.authorId ?? ""}>
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
                defaultValue={handout?.categoryId ?? ""}
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
                defaultValue={handout?.description.ar}
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
                defaultValue={handout?.publisherId ?? ""}
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
                defaultValue={handout?.publishedYear}
              />
            </Field>
            <Field label={t.fields.pages} htmlFor="pages">
              <Input
                id="pages"
                name="pages"
                type="number"
                dir="ltr"
                data-numeric
                defaultValue={handout?.pages}
              />
            </Field>
          </div>
        </Panel>
      </div>

      <div className="space-y-4 lg:col-span-4">
        <Panel title={t.sections.media}>
          <div className="space-y-3">
            <div className="mx-auto w-full max-w-40 rounded-xl bg-surface-low p-4">
              <BookCover
                title={handout?.title[locale] ?? admin.handouts.title}
                author={handout?.author.name[locale] ?? admin.brand.name}
                seed={handout?.slug ?? "new-handout"}
                src={handout?.coverUrl}
                sizes="8rem"
                className="rounded-lg elevation-sm"
              />
            </div>

            <label
              htmlFor="coverImage"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-outline p-5 text-center transition-colors duration-100 ease-fluent hover:border-line-hover hover:bg-state-hover"
            >
              <ImagePlus aria-hidden className="size-5 text-primary" strokeWidth={1.75} />
              <span className="text-label-md text-on-surface">{t.upload.button}</span>
              <span className="text-label-md text-muted">{t.upload.hint}</span>
              <input id="coverImage" name="coverImage" type="file" accept="image/*" className="sr-only" />
            </label>

            <p className="text-label-md text-muted">{t.upload.placeholder}</p>
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
                data-numeric
                defaultValue={handout?.price}
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
                defaultValue={handout?.compareAtPrice}
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
              defaultValue={handout?.stock}
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
                defaultChecked={handout?.tags.includes(tag)}
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
            action={handout ? deleteHandout.bind(null, handout.id) : undefined}
            fallbackError={dictionary.common.toast.actionFailed}
            errorMessages={{
              inUse: dictionary.common.actionErrors.inUse,
              forbidden: dictionary.common.actionErrors.forbidden,
            }}
            itemName={handout?.title[locale]}
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
