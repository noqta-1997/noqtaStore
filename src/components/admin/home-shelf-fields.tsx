import { searchHomeAuthors, searchHomeBooks, searchHomeCategories } from "@/app/actions/admin";
import { Panel } from "@/components/admin/panel";
import { PickList, type PickListLabels } from "@/components/admin/pick-list";
import { ShelfModeFields } from "@/components/admin/shelf-mode-fields";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n/config";
import type { AdminDictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import {
  HOME_SHELVES,
  type HomeShelf,
  type ShelfContent,
  type ShelfKind,
} from "@/lib/home-sections";
import type { PickOption } from "@/types";

interface HomeShelfFieldsProps {
  shelf: HomeShelf;
  locale: Locale;
  admin: AdminDictionary;
  /** The shelf's strings as the store shows them now, each with its label. */
  texts: { name: string; label: string; value: string }[];
  content: ShelfContent;
  /** The picked entries that still exist, in the order they are drawn. */
  picks: PickOption[];
}

/** What each kind of shelf searches through. */
const searchByKind: Record<ShelfKind, (term: string, exclude: string[]) => Promise<PickOption[]>> = {
  book: searchHomeBooks,
  category: searchHomeCategories,
  author: searchHomeAuthors,
};

/**
 * A shelf's fields: its strings, then the choice between the shelf's own
 * rule with a count and a list picked by hand. One component serves every
 * shelf; what differs between them is what they hold and what their rule
 * is, and both are a line of copy here and a query in the data layer.
 */
export function HomeShelfFields({
  shelf,
  locale,
  admin,
  texts,
  content,
  picks,
}: HomeShelfFieldsProps) {
  const t = admin.settings.home;
  const s = t.shelf;
  const { kind, limit: fallback, max } = HOME_SHELVES[shelf];
  const k = s.kinds[kind];

  const pickerLabels: PickListLabels = { ...t.picker, search: k.search };
  const range = s.limitHint.replace("{max}", formatNumber(max, locale));

  return (
    <div className="space-y-4">
      <Panel title={t.form.texts} subtitle={t.form.textsHint}>
        <div className="grid gap-4 sm:grid-cols-2">
          {texts.map((field) => (
            <Field key={field.name} label={field.label} htmlFor={`text-${field.name}`}>
              <Input id={`text-${field.name}`} name={field.name} defaultValue={field.value} />
            </Field>
          ))}
        </div>
      </Panel>

      <Panel title={k.content} subtitle={s.contentHint}>
        <ShelfModeFields
          initial={content.mode}
          labels={{
            auto: s.auto,
            autoNote: s.rules[shelf],
            manual: s.manual,
            manualNote: k.manualNote,
          }}
          auto={
            <Field
              label={k.limit}
              htmlFor="limit"
              hint={fallback === null ? `${range} — ${s.limitAll}` : range}
              className="sm:max-w-xs"
            >
              <Input
                id="limit"
                name="limit"
                type="number"
                dir="ltr"
                min={1}
                max={max}
                step={1}
                data-numeric
                defaultValue={content.limit ?? ""}
              />
            </Field>
          }
          manual={
            <div className="space-y-2">
              <PickList
                name={`${kind}Ids`}
                initial={picks}
                max={max}
                search={searchByKind[kind]}
                locale={locale}
                labels={pickerLabels}
              />
              <p className="text-label-md text-muted">{s.pickHint}</p>
            </div>
          }
        />
      </Panel>
    </div>
  );
}
