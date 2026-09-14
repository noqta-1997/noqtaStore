import Link from "next/link";

import { saveHomeSection, searchHomeBooks } from "@/app/actions/admin";
import { Panel } from "@/components/admin/panel";
import { PickList, type PickListLabels } from "@/components/admin/pick-list";
import { ActionForm } from "@/components/ui/action-form";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/config";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import { HERO_SHOWCASE_SIZE, type HeroContent } from "@/lib/home-sections";
import type { PickOption } from "@/types";

interface HomeHeroFormProps {
  locale: Locale;
  admin: AdminDictionary;
  dictionary: Dictionary;
  /** The hero's strings as the store shows them now — the panel's, or the file's. */
  texts: Dictionary["home"]["hero"];
  content: HeroContent;
  /** The picked title, if one is picked and still in the catalogue. */
  featured: PickOption | null;
  /** The picked jackets, in the order they enter the row. */
  showcase: PickOption[];
  cancelHref: string;
}

/**
 * The edit page for the home page's opening section: its copy on one side,
 * the two book pickers on the other. Every field is prefilled with what the
 * store shows today, so saving an untouched form changes nothing.
 */
export function HomeHeroForm({
  locale,
  admin,
  dictionary,
  texts,
  content,
  featured,
  showcase,
  cancelHref,
}: HomeHeroFormProps) {
  const t = admin.settings.home;
  const h = t.hero;

  const pickerLabels: PickListLabels = { ...t.picker, search: h.searchBooks };

  return (
    <ActionForm
      className="grid gap-4 lg:grid-cols-12"
      action={saveHomeSection}
      successTitle={dictionary.common.toast.saved}
      fallbackError={dictionary.common.toast.actionFailed}
      errorMessages={{
        forbidden: dictionary.common.actionErrors.forbidden,
        unknownSection: dictionary.common.actionErrors.unknownSection,
        invalidLink: dictionary.common.actionErrors.invalidLink,
        unknownBook: dictionary.common.actionErrors.unknownBook,
      }}
    >
      <input type="hidden" name="section" value="hero" />

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

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card p-4 lg:col-span-12">
        <Button type="submit" size="lg">
          {admin.common.saveChanges}
        </Button>
        <Link href={cancelHref} className={buttonStyles({ variant: "subtle", size: "lg" })}>
          {admin.common.cancel}
        </Link>
      </div>
    </ActionForm>
  );
}
