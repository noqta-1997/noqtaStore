"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { createClient } from "@/utils/supabase/client";
import { buttonStyles } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import type { NavItem } from "@/lib/navigation";

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
  };
  loginHref: string;
  accountHref: string;
}

/** Slide-in navigation drawer for small screens. */
export function MobileNav({
  items,
  categories,
  labels,
  loginHref,
  accountHref,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setIsSignedIn(Boolean(data.user));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setIsSignedIn(Boolean(session?.user));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <IconButton
        variant="outline"
        label={labels.menu}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="lg:hidden"
      >
        <Menu aria-hidden className="size-5" strokeWidth={2} />
      </IconButton>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={labels.close}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-inverse-surface/70"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={labels.menu}
            className="absolute inset-y-0 start-0 flex w-[min(20rem,85vw)] flex-col border-e-2 border-line bg-surface"
          >
            <div className="flex items-center justify-between border-b-2 border-line p-4">
              <span className="label-mono text-muted">{labels.menu}</span>
              <div className="flex items-center gap-1">
                <ThemeToggle labels={labels.theme} />
                <IconButton
                  variant="outline"
                  label={labels.close}
                  onClick={() => setIsOpen(false)}
                >
                  <X aria-hidden className="size-5" strokeWidth={2} />
                </IconButton>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2.5 font-display text-lg font-bold text-on-surface hover:bg-surface-high"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="label-mono mt-6 mb-2 px-3 text-muted">
                {labels.categories}
              </p>
              <ul className="space-y-0.5">
                {categories.map((category) => (
                  <li key={category.href}>
                    <Link
                      href={category.href}
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-high hover:text-on-surface"
                    >
                      {category.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-2 border-t-2 border-line p-4">
              {isSignedIn ? (
                <>
                  <Link
                    href={accountHref}
                    onClick={() => setIsOpen(false)}
                    className={buttonStyles({ fullWidth: true })}
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
                    className="flex w-full items-center justify-center gap-2 border border-line px-4 py-2.5 text-label-md font-semibold text-error transition-colors hover:bg-error-container hover:text-on-error-container"
                  >
                    <LogOut aria-hidden className="size-4 rtl:rotate-180" strokeWidth={2} />
                    {labels.logout}
                  </button>
                </>
              ) : (
                <Link
                  href={loginHref}
                  onClick={() => setIsOpen(false)}
                  className={buttonStyles({ fullWidth: true })}
                >
                  {labels.login}
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
