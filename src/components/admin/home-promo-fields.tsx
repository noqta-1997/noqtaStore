import { Panel } from "@/components/admin/panel";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import { PROMO_FIGURE_MAX, type PromoContent } from "@/lib/home-sections";

interface HomePromoFieldsProps {
  admin: AdminDictionary;
  /** The banner's strings as the store shows them now — the panel's, or the file's. */
  texts: Dictionary["home"]["promo"];
  content: PromoContent;
}

/**
 * The offer banner's fields: its four lines of copy, where its button goes,
 * and the figure ghosted behind it — kept beside the headline it usually
 * repeats, so the two are changed together.
 */
export function HomePromoFields({ admin, texts, content }: HomePromoFieldsProps) {
  const t = admin.settings.home;
  const p = t.promo;

  return (
    <Panel title={t.form.texts} subtitle={t.form.textsHint}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={p.eyebrow} htmlFor="eyebrow">
          <Input id="eyebrow" name="eyebrow" defaultValue={texts.eyebrow} />
        </Field>
        <Field label={p.title} htmlFor="title">
          <Input id="title" name="title" defaultValue={texts.title} />
        </Field>
        <Field label={p.description} htmlFor="description" className="sm:col-span-2">
          <Textarea id="description" name="description" rows={2} defaultValue={texts.description} />
        </Field>
        <Field label={p.cta} htmlFor="cta">
          <Input id="cta" name="cta" defaultValue={texts.cta} />
        </Field>
        <Field label={p.href} htmlFor="href" hint={t.form.linkHint}>
          <Input id="href" name="href" dir="ltr" defaultValue={content.href} />
        </Field>
        <Field label={p.figure} htmlFor="figure" hint={p.figureHint}>
          <Input
            id="figure"
            name="figure"
            dir="ltr"
            maxLength={PROMO_FIGURE_MAX}
            data-numeric
            defaultValue={content.figure}
            className="sm:max-w-40"
          />
        </Field>
      </div>
    </Panel>
  );
}
