import { Container } from "@/components/ui/container";
import { List } from "@/components/ui/list-row";
import { PageHeader } from "@/components/ui/page-header";
import type { Crumb } from "@/components/ui/breadcrumb";

interface InfoSection {
  title: string;
  body: string;
}

interface InfoPageProps {
  title: string;
  subtitle: string;
  sections: InfoSection[];
  crumbs: Crumb[];
  crumbsLabel: string;
}

/** Shared template for the store's static content pages. */
export function InfoPage({
  title,
  subtitle,
  sections,
  crumbs,
  crumbsLabel,
}: InfoPageProps) {
  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        crumbs={crumbs}
        crumbsLabel={crumbsLabel}
      />

      <Container className="py-8 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <List as="ol">
            {sections.map((section, index) => (
              <li key={section.title} className="flex gap-4 p-5 sm:gap-6 sm:p-8">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-md font-semibold text-primary"
                  data-numeric
                >
                  {index + 1}
                </span>
                <div className="min-w-0 space-y-2">
                  <h2 className="text-body-lg font-bold">{section.title}</h2>
                  <p className="text-body-md leading-relaxed text-on-surface-variant">
                    {section.body}
                  </p>
                </div>
              </li>
            ))}
          </List>
        </div>
      </Container>
    </>
  );
}
