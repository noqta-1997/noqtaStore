import { Panel } from "@/components/admin/panel";
import { featureIcons } from "@/components/home/features-strip";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import { HOME_FEATURES } from "@/lib/home-sections";

interface HomeFeaturesFieldsProps {
  admin: AdminDictionary;
  /** The strip's strings as the store shows them now — the panel's, or the file's. */
  texts: Dictionary["home"]["features"];
}

/**
 * The services strip's fields: four groups, one per promise, each headed by
 * the icon the store draws beside it so the admin can tell which of the
 * four they are rewriting without reading the current wording first.
 */
export function HomeFeaturesFields({ admin, texts }: HomeFeaturesFieldsProps) {
  const t = admin.settings.home;
  const f = t.features;

  return (
    <Panel title={t.form.texts} subtitle={t.form.textsHint}>
      <div className="grid gap-4 sm:grid-cols-2">
        {HOME_FEATURES.map((feature) => {
          const Icon = featureIcons[feature];
          const headingId = `feature-${feature}-heading`;

          return (
            <div
              key={feature}
              role="group"
              aria-labelledby={headingId}
              className="min-w-0 space-y-4 rounded-xl border border-line bg-surface-low p-4"
            >
              <p
                id={headingId}
                className="flex items-center gap-3 text-body-md font-semibold text-on-surface"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed">
                  <Icon aria-hidden className="size-4 text-primary" strokeWidth={1.75} />
                </span>
                {f.groups[feature]}
              </p>

              <Field label={f.title} htmlFor={`feature-${feature}-title`}>
                <Input
                  id={`feature-${feature}-title`}
                  name={`${feature}.title`}
                  defaultValue={texts[feature].title}
                />
              </Field>
              <Field label={f.description} htmlFor={`feature-${feature}-description`}>
                <Input
                  id={`feature-${feature}-description`}
                  name={`${feature}.description`}
                  defaultValue={texts[feature].description}
                />
              </Field>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
