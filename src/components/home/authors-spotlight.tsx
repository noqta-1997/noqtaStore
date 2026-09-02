import { AuthorCard } from "@/components/author/author-card";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Author } from "@/types";

interface AuthorsSpotlightProps {
  locale: Locale;
  dictionary: Dictionary;
  authors: Author[];
}

/**
 * The reference runs its author chips three or four to a line rather than six,
 * because each one is now a portrait beside a name instead of a stacked card.
 */
export function AuthorsSpotlight({
  locale,
  dictionary,
  authors,
}: AuthorsSpotlightProps) {
  const section = dictionary.home.authors;

  return (
    <section className="pb-14 lg:pb-20">
      <Container>
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle}
          actionLabel={dictionary.common.viewAll}
          actionHref={`/${locale}/authors`}
        />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <li key={author.id}>
              <AuthorCard
                author={author}
                locale={locale}
                booksLabel={section.booksCount}
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
