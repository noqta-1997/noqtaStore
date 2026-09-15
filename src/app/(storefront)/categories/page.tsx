import type { Metadata } from "next";

import { BranchCard } from "@/components/category/branch-card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { getCategoryTree, queryBooks } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.categoriesPage.title };
}

/**
 * The tree, one card per top-level branch: a stage with its grades and their
 * branches listed inside, or one of the older genres on its own. The stages
 * come first; the genres trail until their titles are re-filed.
 */
export default async function CategoriesPage() {
  const locale = defaultLocale;

  const [dictionary, branches] = await Promise.all([
    getDictionary(locale),
    getCategoryTree(),
  ]);

  /* Three covers per card give it a sense of what's inside — drawn from
     anywhere under the branch, since a stage holds no books of its own. */
  const previews = await Promise.all(
    branches.map(async (branch) => {
      const result = await queryBooks({
        category: branch.slug,
        sort: "popular",
        perPage: 3,
      });
      return { branch, books: result.items };
    }),
  );

  const t = dictionary.categoriesPage;

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: "/" },
          { label: t.title },
        ]}
      />

      <Container className="py-8 lg:py-12">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {previews.map(({ branch, books }) => (
            <li key={branch.id}>
              <BranchCard
                branch={branch}
                books={books}
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
