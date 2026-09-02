"use client";

import { Tab, TabList } from "@fluentui/react-components";
import { useId, useState, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  className?: string;
}

/**
 * Fluent's TabList. Panels stay server-rendered and arrive as props, so the
 * page using this is still a Server Component.
 *
 * The hand-rolled version had correct ARIA but no keyboard navigation: arrow
 * keys did nothing and every tab was a separate tab stop. Fluent brings the
 * roving tabindex that `role="tablist"` implies.
 */
export function Tabs({ items, className }: TabsProps) {
  const [active, setActive] = useState(items[0]?.id);
  const base = useId();

  return (
    <div className={className}>
      <TabList
        selectedValue={active}
        onTabSelect={(_, data) => setActive(String(data.value))}
      >
        {items.map((item) => (
          <Tab
            key={item.id}
            value={item.id}
            id={`${base}-tab-${item.id}`}
            aria-controls={`${base}-panel-${item.id}`}
          >
            {item.label}
          </Tab>
        ))}
      </TabList>

      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${base}-panel-${item.id}`}
          aria-labelledby={`${base}-tab-${item.id}`}
          hidden={item.id !== active}
          className="rounded-b-md border border-t-0 border-line bg-card p-4 sm:p-6"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
