import { Panel } from "@/components/admin/panel";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";

interface HomeNewsletterFieldsProps {
  admin: AdminDictionary;
  /** The card's strings as the store shows them now — the panel's, or the file's. */
  texts: Dictionary["home"]["newsletter"];
}

/**
 * The newsletter card's fields: the heading and description, then the three
 * strings of the form itself — what the address field says while empty,
 * what the button says, and the line under them.
 */
export function HomeNewsletterFields({ admin, texts }: HomeNewsletterFieldsProps) {
  const t = admin.settings.home;
  const n = t.newsletter;

  return (
    <Panel title={t.form.texts} subtitle={t.form.textsHint}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={n.title} htmlFor="title" className="sm:col-span-2">
          <Input id="title" name="title" defaultValue={texts.title} />
        </Field>
        <Field label={n.description} htmlFor="description" className="sm:col-span-2">
          <Textarea id="description" name="description" rows={2} defaultValue={texts.description} />
        </Field>
        <Field label={n.placeholder} htmlFor="placeholder">
          <Input id="placeholder" name="placeholder" defaultValue={texts.placeholder} />
        </Field>
        <Field label={n.cta} htmlFor="cta">
          <Input id="cta" name="cta" defaultValue={texts.cta} />
        </Field>
        <Field label={n.note} htmlFor="note" className="sm:col-span-2">
          <Input id="note" name="note" defaultValue={texts.note} />
        </Field>
      </div>
    </Panel>
  );
}
