"use client";

import { LayoutDashboard, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { createClient } from "@/utils/supabase/client";
import { buttonStyles } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { IconButton } from "@/components/ui/icon-button";
import type { NavItem } from "@/lib/navigation";
import { isOwner } from "@/lib/owner";

interface MobileNavProps {
  items: NavItem[];
  categories: NavItem[];
  labels: {
    menu: string;
    close: string;
    login: string;
    categories: string;
    theme: { toggle: string; light: string; dark: string };
    account: string;
    logout: string;
    adminPanel: string;
  };
  loginHref: string;
  accountHref: string;
  /** Only rendered for the owner; the server still guards the route. */
  adminHref: string;
}

/** Slide-in navigation drawer for small screens. */
export function MobileNav({
  items,
  categories,
  labels,
  loginHref,
  accountHref,
  adminHref,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  /* Display only — the server decides who may actually open the panel. */
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setIsSignedIn(Boolean(data.user));
      setEmail(data.user?.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setIsSignedIn(Boolean(session?.user));
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <IconButton
        variant="outline"
        label={labels.menu}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="lg:hidden"
      >
        <Menu aria-hidden className="size-5" strokeWidth={1.75} />
      </IconButton>

      <Drawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={labels.menu}
        closeLabel={labels.close}
        position="start"
        headerAction={<ThemeToggle labels={labels.theme} />}
      >
        <nav aria-label={labels.menu}>
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-body-lg font-semibold text-on-surface transition-colors duration-100 ease-fluent hover:bg-state-hover"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="label-mono mt-5 mb-2 px-3 text-muted">{labels.categories}</p>
          <ul className="space-y-0.5">
            {categories.map((category) => (
              <li key={category.href}>
                <Link
                  href={category.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-body-md text-on-surface-variant transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-on-surface"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6 space-y-2 border-t border-line-divider pt-4">
          {isSignedIn ? (
            <>
              {isOwner(email) ? (
                <Link
                  href={adminHref}
                  onClick={() => setIsOpen(false)}
                  className={buttonStyles({
                    variant: "secondary",
                    size: "lg",
                    fullWidth: true,
                  })}
                >
                  <LayoutDashboard aria-hidden className="size-4" strokeWidth={1.75} />
                  {labels.adminPanel}
                </Link>
              ) : null}

              <Link
                href={accountHref}
                onClick={() => setIsOpen(false)}
                className={buttonStyles({ size: "lg", fullWidth: true })}
              >
                {labels.account}
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await createClient().auth.signOut();
                  setIsOpen(false);
                  router.replace("/");
                  router.refresh();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-line px-4 py-2 text-body-md font-semibold text-error transition-colors duration-100 ease-fluent hover:bg-error-container"
              >
                <LogOut aria-hidden className="size-4 rtl:rotate-180" strokeWidth={1.75} />
                {labels.logout}
              </button>
            </>
          ) : (
            <Link
              href={loginHref}
              onClick={() => setIsOpen(false)}
              className={buttonStyles({ size: "lg", fullWidth: true })}
            >
              {labels.login}
            </Link>
          )}
        </div>
      </Drawer>
    </>
  );
}
