"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { AdminNav, type AdminNavLabels } from "@/components/admin/admin-nav";
import { Drawer } from "@/components/ui/drawer";
import { IconButton } from "@/components/ui/icon-button";

interface AdminMobileNavProps {
  locale: string;
  labels: AdminNavLabels;
  panelLabel: string;
  menuLabel: string;
  closeLabel: string;
}

/** The admin navigation as a drawer on phones. */
export function AdminMobileNav({
  locale,
  labels,
  panelLabel,
  menuLabel,
  closeLabel,
}: AdminMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <IconButton
        variant="outline"
        label={menuLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="md:hidden"
      >
        <Menu aria-hidden className="size-5" strokeWidth={2} />
      </IconButton>

      <Drawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={panelLabel}
        closeLabel={closeLabel}
        position="start"
      >
        <AdminNav locale={locale} labels={labels} onNavigate={() => setIsOpen(false)} />
      </Drawer>
    </>
  );
}
