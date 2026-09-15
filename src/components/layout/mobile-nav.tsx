"use client";

import { ChevronDown, LayoutDashboard, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { createClient } from "@/utils/supabase/client";
import { buttonStyles } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { IconButton } from "@/components/ui/icon-button";
import type { CatalogueMenu, MenuBranch } from "@/lib/category-menu";
import type { NavItem } from "@/lib/navigation";
import { isOwner } from "@/lib/owner";

interface MobileNavProps {
  items: NavItem[];
  /** One tree per catalogue, listed after the main links under its own title. */
  trees: { title: string; menu: CatalogueMenu }[];
  labels: {
    menu: string;
    close: string;
    login: string;
    /** "كل {name}" — the link to a whole stage, at the top of its opened list. */
    wholeBranch: string;
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

const branchLinkStyles =
  "block rounded-md px-3 py-2 text-body-md text-on-surface-variant transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-on-surface";

/**
 * A stage in the drawer: a disclosure that opens on its grades, with a link
 * to the stage itself as the first row and a grade's branches on the line
 * under the grade. A branch with nothing under it is a plain link.
 */
function BranchDisclosure({
  branch,
  wholeLabel,
  onNavigate,
}: {
  branch: MenuBranch;
  wholeLabel: string;
  onNavigate: () => void;
}) {
  if (!branch.children.length) {
    return (
      <Link href={branch.href} onClick={onNavigate} className={branchLinkStyles}>
        {branch.name}
      </Link>
    );
  }

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 py-2 text-body-md font-semibold text-on-surface transition-colors duration-100 ease-fluent hover:bg-state-hover [&::-webkit-details-marker]:hidden">
        {branch.name}
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-muted transition-transform duration-100 ease-fluent group-open:rotate-180"
          strokeWidth={1.75}
        />
      </summary>
      <ul className="mb-1 space-y-0.5 border-s border-line-divider ms-4 ps-1">
        <li>
          <Link href={branch.href} onClick={onNavigate} className={branchLinkStyles}>
            {wholeLabel.replace("{name}", branch.name)}
          </Link>
        </li>
        {branch.children.map((child) => (
          <li key={child.id}>
            <Link href={child.href} onClick={onNavigate} className={branchLinkStyles}>
              {child.name}
            </Link>
            {child.children.length ? (
              <ul className="flex flex-wrap gap-x-1 px-3 pb-1">
                {child.children.map((leaf) => (
                  <li key={leaf.id}>
                    <Link
                      href={leaf.href}
                      onClick={onNavigate}
                      className="inline-block rounded-md px-2 py-1 text-label-md text-muted transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-on-surface"
                    >
                      {leaf.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Slide-in navigation drawer for small screens. */
export function MobileNav({
  items,
  trees,
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

          {trees.map((tree) => (
            <section key={tree.title} aria-label={tree.title}>
              <p className="label-mono mt-5 mb-2 px-3 text-muted">{tree.title}</p>
              <ul className="space-y-0.5">
                {[...tree.menu.columns, ...tree.menu.others].map((branch) => (
                  <li key={branch.id}>
                    <BranchDisclosure
                      branch={branch}
                      wholeLabel={labels.wholeBranch}
                      onNavigate={() => setIsOpen(false)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
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
