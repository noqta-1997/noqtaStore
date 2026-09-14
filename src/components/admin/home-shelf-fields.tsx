import { searchHomeBooks } from "@/app/actions/admin";
import { Panel } from "@/components/admin/panel";
import { PickList, type PickListLabels } from "@/components/admin/pick-list";
import { ShelfModeFields } from "@/components/admin/shelf-mode-fields";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n/config";
import type { AdminDictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import { HOME_SHELVES, type HomeShelf, type ShelfContent } from "@/lib/home-sections";
import type { PickOption } from "@/types";

interface HomeShelfFieldsProps {
  shelf: HomeShelf;
  locale: Locale;
  admin: AdminDictionary;
  /** The shelf's two strings as the store shows them now — the panel's, or the file's. */
  texts: { title: string; subtitle: string };
  content: ShelfContent;
  /** The picked titles still in the catalogue, in the order they are drawn. */
  picks: PickOption[];
}

/**
 * A book shelf's fields: its heading, then the choice between the shelf's
 * own rule with a count and a list picked by hand. One component serves
 * every shelf of books; what differs between them is the rule, and that is
 * a line of copy here and a query in the data layer.
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
  const { max } = HOME_SHELVES[shelf];

  const pickerLabels: PickListLabels = { ...t.picker, search: t.picker.searchBooks };
  const range = s.limitHint.replace("{max}", formatNumber(max, locale));

  return (
    <div className="space-y-4">
      <Panel title={t.form.texts} subtitle={t.form.textsHint}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={s.title} htmlFor="title">
            <Input id="title" name="title" defaultValue={texts.title} />
          </Field>
          <Field label={s.subtitle} htmlFor="subtitle">
            <Input id="subtitle" name="subtitle" defaultValue={texts.subtitle} />
          </Field>
        </div>
      </Panel>

      <Panel title={s.content} subtitle={s.contentHint}>
        <ShelfModeFields
          initial={content.mode}
          labels={{
            auto: s.auto,
            autoNote: s.rules[shelf],
            manual: s.manual,
            manualNote: s.manualNote,
          }}
          auto={
            <Field label={s.limit} htmlFor="limit" hint={range} className="sm:max-w-xs">
              <Input
                id="limit"
                name="limit"
                type="number"
                dir="ltr"
                min={1}
                max={max}
                step={1}
                data-numeric
                defaultValue={content.limit}
              />
            </Field>
          }
          manual={
            <div className="space-y-2">
              <PickList
                name="bookIds"
                initial={picks}
                max={max}
                search={searchHomeBooks}
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
