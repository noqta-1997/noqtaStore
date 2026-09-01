"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/utils/supabase/client";

interface AdminSignOutProps {
  locale: string;
  label: string;
}

/** The panel needs its own way out; the storefront menu is a page away. */
export function AdminSignOut({ locale, label }: AdminSignOutProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    setPending(true);
    await createClient().auth.signOut();
    router.replace(`/${locale}/login`);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center border border-transparent text-on-surface transition-colors hover:border-line hover:bg-surface-high disabled:opacity-60"
    >
      <LogOut aria-hidden className="size-4.5 rtl:-scale-x-100" strokeWidth={2} />
    </button>
  );
}
