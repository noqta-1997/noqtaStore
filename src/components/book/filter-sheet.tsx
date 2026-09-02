"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";

interface FilterSheetProps {
  labels: { open: string; title: string; close: string };
  children: ReactNode;
}

/** Wraps the same filter form in a drawer on small screens. */
export function FilterSheet({ labels, children }: FilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button variant="secondary" size="lg" onClick={() => setIsOpen(true)} fullWidth>
        <SlidersHorizontal aria-hidden className="size-4" strokeWidth={2} />
        {labels.open}
      </Button>

      <Drawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={labels.title}
        closeLabel={labels.close}
        position="bottom"
      >
        {children}
      </Drawer>
    </div>
  );
}
