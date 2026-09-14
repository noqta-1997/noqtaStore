import Link from "next/link";
import type { ReactNode } from "react";

import { saveHomeSection } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { Button, buttonStyles } from "@/components/ui/button";
import type { AdminDictionary, Dictionary } from "@/i18n/get-dictionary";
import type { HomeSection } from "@/lib/home-sections";

interface HomeSectionFormProps {
  section: HomeSection;
  admin: AdminDictionary;
  dictionary: Dictionary;
  cancelHref: string;
  /** The section's own fields; the frame, the action and the save bar are shared. */
  children: ReactNode;
}

/**
 * The frame every home section's edit page posts through: one action, one
 * hidden field naming the section, and the same save bar as the catalogue
 * forms. Every field inside is prefilled with what the store shows today, so
 * saving an untouched form changes nothing.
 */
export function HomeSectionForm({
  section,
  admin,
  dictionary,
  cancelHref,
  children,
}: HomeSectionFormProps) {
  return (
    <ActionForm
      className="space-y-4"
      action={saveHomeSection}
      successTitle={dictionary.common.toast.saved}
      fallbackError={dictionary.common.toast.actionFailed}
      errorMessages={{
        forbidden: dictionary.common.actionErrors.forbidden,
        unknownSection: dictionary.common.actionErrors.unknownSection,
        invalidLink: dictionary.common.actionErrors.invalidLink,
        unknownBook: dictionary.common.actionErrors.unknownBook,
        unknownCategory: dictionary.common.actionErrors.unknownCategory,
        unknownAuthor: dictionary.common.actionErrors.unknownAuthor,
      }}
    >
      <input type="hidden" name="section" value={section} />

      {children}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card p-4">
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
