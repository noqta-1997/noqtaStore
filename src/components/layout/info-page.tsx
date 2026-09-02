import { Container } from "@/components/ui/container";
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
          <ol className="divide-y divide-line-divider rounded-md border border-line bg-card">
            {sections.map((section, index) => (
              <li key={section.title} className="flex gap-4 p-5 sm:gap-6 sm:p-8">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-low font-mono text-label-md"
                  data-numeric
                >
                  {index + 1}
                </span>
                <div className="min-w-0 space-y-2">
                  <h2 className="font-display text-lg font-bold">{section.title}</h2>
                  <p className="text-body-md leading-relaxed text-on-surface-variant">
                    {section.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </>
  );
}
