import { searchHomeBooks } from "@/app/actions/admin";
import { Panel } from "@/components/admin/panel";
import { PickList, type PickListLabels } from "@/components/admin/pick-list";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/config";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import { HERO_SHOWCASE_SIZE, type HeroContent } from "@/lib/home-sections";
import type { PickOption } from "@/types";

interface HomeHeroFieldsProps {
  locale: Locale;
  admin: AdminDictionary;
  /** The hero's strings as the store shows them now — the panel's, or the file's. */
  texts: Dictionary["home"]["hero"];
  content: HeroContent;
  /** The picked title, if one is picked and still in the catalogue. */
  featured: PickOption | null;
  /** The picked jackets, in the order they enter the row. */
  showcase: PickOption[];
}

/**
 * The opening section's fields: its copy on one side, the two book pickers
 * on the other.
 */
export function HomeHeroFields({
  locale,
  admin,
  texts,
  content,
  featured,
  showcase,
}: HomeHeroFieldsProps) {
  const t = admin.settings.home;
  const h = t.hero;

  const pickerLabels: PickListLabels = { ...t.picker, search: h.searchBooks };

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Panel title={t.form.texts} subtitle={t.form.textsHint}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={h.featuredLabel} htmlFor="featuredLabel" className="sm:col-span-2">
              <Input id="featuredLabel" name="featuredLabel" defaultValue={texts.featuredLabel} />
            </Field>
            <Field label={h.title} htmlFor="title">
              <Input id="title" name="title" defaultValue={texts.title} />
            </Field>
            <Field label={h.titleHighlight} htmlFor="titleHighlight">
              <Input
                id="titleHighlight"
                name="titleHighlight"
                defaultValue={texts.titleHighlight}
              />
            </Field>
            <Field label={h.subtitle} htmlFor="subtitle" className="sm:col-span-2">
              <Textarea id="subtitle" name="subtitle" rows={3} defaultValue={texts.subtitle} />
            </Field>
            <Field label={h.primaryCta} htmlFor="primaryCta">
              <Input id="primaryCta" name="primaryCta" defaultValue={texts.primaryCta} />
            </Field>
            <Field label={h.primaryHref} htmlFor="primaryHref" hint={h.linkHint}>
              <Input
                id="primaryHref"
                name="primaryHref"
                dir="ltr"
                defaultValue={content.primaryHref}
              />
            </Field>
            <Field label={h.secondaryCta} htmlFor="secondaryCta">
              <Input id="secondaryCta" name="secondaryCta" defaultValue={texts.secondaryCta} />
            </Field>
            <Field label={h.secondaryHref} htmlFor="secondaryHref" hint={h.linkHint}>
              <Input
                id="secondaryHref"
                name="secondaryHref"
                dir="ltr"
                defaultValue={content.secondaryHref}
              />
            </Field>
          </div>
        </Panel>
      </div>

      <div className="space-y-4 lg:col-span-5">
        <Panel title={h.featuredBook} subtitle={h.featuredBookHint}>
          <PickList
            name="featuredBookId"
            initial={featured ? [featured] : []}
            max={1}
            search={searchHomeBooks}
            locale={locale}
            labels={pickerLabels}
          />
        </Panel>

        <Panel title={h.showcase} subtitle={h.showcaseHint}>
          <PickList
            name="showcaseIds"
            initial={showcase}
            max={HERO_SHOWCASE_SIZE}
            search={searchHomeBooks}
            locale={locale}
            labels={pickerLabels}
          />
        </Panel>
      </div>
    </div>
  );
}
