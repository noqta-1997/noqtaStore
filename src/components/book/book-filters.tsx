import Link from "next/link";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { indentFor } from "@/lib/category-tree";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CategoryOption, CoverType, Publisher } from "@/types";

export interface BookFilterValues {
  category?: string;
  publisher?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  cover?: CoverType;
  inStock: boolean;
  onSale: boolean;
  sort?: string;
  q?: string;
}

interface BookFiltersProps {
  action: string;
  resetHref: string;
  locale: Locale;
  dictionary: Dictionary;
  /** Either tree in order; each branch is indented under its parent. */
  categories: CategoryOption[];
  publishers: Publisher[];
  values: BookFilterValues;
  bounds: { min: number; max: number };
  /** Hide the category control on pages that are already scoped to one. */
  showCategory?: boolean;
  className?: string;
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-line-divider pt-5 first:border-t-0 first:pt-0">
      <legend className="label-mono mb-3 text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * A plain GET form: filtering works with the browser alone, and every
 * state is a shareable URL. No client JavaScript involved.
 */
export function BookFilters({
  action,
  resetHref,
  locale,
  dictionary,
  categories,
  publishers,
  values,
  bounds,
  showCategory = true,
  className,
}: BookFiltersProps) {
  const t = dictionary.books;

  return (
    <form
      action={action}
      method="get"
      className={cn("space-y-5 rounded-xl border border-line bg-card p-5", className)}
    >
      {values.q ? <input type="hidden" name="q" value={values.q} /> : null}
      {values.sort ? <input type="hidden" name="sort" value={values.sort} /> : null}

      <h2 className="text-headline-md">{t.filtersTitle}</h2>

      {showCategory ? (
        <Group title={t.category}>
          <Select
            name="category"
            defaultValue={values.category ?? ""}
            aria-label={t.category}
          >
            <option value="">{t.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {indentFor(category.depth)}
                {category.name[locale]}
              </option>
            ))}
          </Select>
        </Group>
      ) : null}

      <Group title={t.publisher}>
        <Select
          name="publisher"
          defaultValue={values.publisher ?? ""}
          aria-label={t.publisher}
        >
          <option value="">{t.allPublishers}</option>
          {publishers.map((publisher) => (
            <option key={publisher.id} value={publisher.slug}>
              {publisher.name[locale]}
            </option>
          ))}
        </Select>
      </Group>

      <Group title={t.priceRange}>
        <div className="flex items-end gap-3">
          <label className="flex-1 space-y-1.5">
            <span className="block text-label-md text-muted">{t.minPrice}</span>
            <Input
              type="number"
              name="minPrice"
              inputMode="numeric"
              min={bounds.min}
              max={bounds.max}
              step={1000}
              defaultValue={values.minPrice ?? ""}
              placeholder={formatNumber(bounds.min, locale)}
              data-numeric
            />
          </label>
          <label className="flex-1 space-y-1.5">
            <span className="block text-label-md text-muted">{t.maxPrice}</span>
            <Input
              type="number"
              name="maxPrice"
              inputMode="numeric"
              min={bounds.min}
              max={bounds.max}
              step={1000}
              defaultValue={values.maxPrice ?? ""}
              placeholder={formatNumber(bounds.max, locale)}
              data-numeric
            />
          </label>
        </div>
      </Group>

      <Group title={t.rating}>
        <div className="space-y-2">
          {[4, 3, 2].map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2.5 text-body-md"
            >
              <input
                type="radio"
                name="rating"
                value={value}
                defaultChecked={values.rating === value}
                className="size-4.5 shrink-0 appearance-none rounded-full border border-line-strong bg-card checked:border-primary-container checked:bg-primary-container checked:shadow-[inset_0_0_0_3px_var(--card)]"
              />
              <span className="flex items-center gap-1">
                {Array.from({ length: value }, (_, index) => (
                  <Star
                    key={index}
                    aria-hidden
                    className="size-3.5 fill-gold text-gold"
                    strokeWidth={0}
                  />
                ))}
              </span>
              <span className="text-label-md text-muted">{t.ratingAndUp}</span>
            </label>
          ))}
        </div>
      </Group>

      <Group title={t.coverType}>
        <Select name="cover" defaultValue={values.cover ?? ""} aria-label={t.coverType}>
          <option value="">{t.allCategories}</option>
          <option value="hardcover">{t.hardcover}</option>
          <option value="paperback">{t.paperback}</option>
        </Select>
      </Group>

      <Group title={t.availability}>
        <div className="space-y-2.5">
          <Checkbox
            id="filter-in-stock"
            name="inStock"
            value="1"
            defaultChecked={values.inStock}
            label={t.inStockOnly}
          />
          <Checkbox
            id="filter-on-sale"
            name="onSale"
            value="1"
            defaultChecked={values.onSale}
            label={t.onSaleOnly}
          />
        </div>
      </Group>

      <div className="flex items-center gap-2 border-t border-line-divider pt-5">
        <Button type="submit" fullWidth>
          {dictionary.common.apply}
        </Button>
        <Link
          href={resetHref}
          className="shrink-0 px-3 py-2 text-label-md text-muted underline-offset-4 hover:text-on-surface hover:underline"
        >
          {dictionary.common.clear}
        </Link>
      </div>
    </form>
  );
}
