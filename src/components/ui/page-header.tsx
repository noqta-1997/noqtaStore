import type { ReactNode } from "react";

import { Breadcrumb, type Crumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  crumbs?: Crumb[];
  crumbsLabel?: string;
  actions?: ReactNode;
  className?: string;
}

/** Shared banner at the top of every inner page. */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  crumbs,
  crumbsLabel = "Breadcrumb",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section className={cn("border-b-2 border-line bg-surface-low", className)}>
      <Container className="space-y-4 py-8 lg:py-10">
        {crumbs?.length ? <Breadcrumb items={crumbs} label={crumbsLabel} /> : null}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="label-mono text-primary">{eyebrow}</p>
            ) : null}
            <h1 className="text-headline-lg sm:text-[2.5rem] sm:leading-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="max-w-2xl text-body-md text-on-surface-variant">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions}
        </div>
      </Container>
    </section>
  );
}
