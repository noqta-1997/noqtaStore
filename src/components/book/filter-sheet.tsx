"use client";

import { SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";

interface FilterSheetProps {
  labels: { open: string; title: string; close: string };
  children: ReactNode;
}

/**
 * Wraps the same filter form in a drawer on small screens.
 *
 * Applying the filters is a client-side navigation to the same page, and
 * React keeps a page's client state across a change of its search params,
 * so a drawer that simply remembered "open" would still be open over the
 * results it had just asked for. It is open only while the URL is the one
 * it was opened on: the submit closes it at once, and a commit it did not
 * see coming — back, forward — closes it too.
 */
export function FilterSheet({ labels, children }: FilterSheetProps) {
  const query = useSearchParams().toString();
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const isOpen = openedOn === query;

  return (
    <div className="lg:hidden" onSubmit={() => setOpenedOn(null)}>
      <Button variant="secondary" size="lg" onClick={() => setOpenedOn(query)} fullWidth>
        <SlidersHorizontal aria-hidden className="size-4" strokeWidth={1.75} />
        {labels.open}
      </Button>

      <Drawer
        open={isOpen}
        onClose={() => setOpenedOn(null)}
        title={labels.title}
        closeLabel={labels.close}
        position="bottom"
      >
        {children}
      </Drawer>
    </div>
  );
}
