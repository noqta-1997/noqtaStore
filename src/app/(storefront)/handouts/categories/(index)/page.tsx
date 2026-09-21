import type { Metadata } from "next";

import { HandoutBranchCard } from "@/components/handout/handout-branch-card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { getHandoutCategoryTree, queryHandouts } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.handoutCategoriesPage.title };
}

/**
 * The handouts' tree, one card per top-level branch — the categories page
 * over the other table. The stages come first; the genres the seeded handouts
 * were filed under trail until they are re-filed.
 */
export default async function HandoutCategoriesPage() {
  const locale = defaultLocale;

  const [dictionary, branches] = await Promise.all([
    getDictionary(locale),
    getHandoutCategoryTree(),
  ]);

  /* Three covers per card give it a sense of what's inside — drawn from
     anywhere under the branch, since a stage holds no handouts of its own. */
  const previews = await Promise.all(
    branches.map(async (branch) => {
      const result = await queryHandouts({
        category: branch.slug,
        sort: "popular",
        perPage: 3,
      });
      return { branch, handouts: result.items };
    }),
  );

  const t = dictionary.handoutCategoriesPage;

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: "/" },
          { label: dictionary.handouts.title, href: "/handouts" },
          { label: t.title },
        ]}
      />

      <Container className="py-8 lg:py-12">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {previews.map(({ branch, handouts }) => (
            <li key={branch.id}>
              <HandoutBranchCard
                branch={branch}
                handouts={handouts}
                locale={locale}
                dictionary={dictionary}
              />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
