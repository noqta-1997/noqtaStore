import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AccordionItem {
  title: string;
  body: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

/** Native disclosure list — no JavaScript needed. */
export function Accordion({ items, className }: AccordionProps) {
  return (
    <div className={cn("divide-y divide-line-divider rounded-md border border-line bg-card", className)}>
      {items.map((item) => (
        <details key={item.title} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-body-md font-semibold text-on-surface hover:bg-state-hover">
            {item.title}
            <Plus
              aria-hidden
              className="size-5 shrink-0 text-primary transition-transform duration-100 ease-fluent group-open:rotate-45"
              strokeWidth={2}
            />
          </summary>
          <p className="px-5 pb-5 text-body-md leading-relaxed text-on-surface-variant">
            {item.body}
          </p>
        </details>
      ))}
    </div>
  );
}
