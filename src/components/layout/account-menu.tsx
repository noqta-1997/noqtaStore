"use client";

import {
  Menu,
  MenuDivider,
  MenuItem,
  MenuItemLink,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from "@fluentui/react-components";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Star,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { isOwner } from "@/lib/owner";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface AccountMenuProps {
  labels: {
    login: string;
    account: string;
    profile: string;
    orders: string;
    wishlist: string;
    addresses: string;
    reviews: string;
    logout: string;
    signedInAs: string;
    adminPanel: string;
  };
}

/**
 * Header account control. The session is read in the browser so the whole
 * storefront shell can stay statically rendered — only this control changes
 * once Supabase resolves who is signed in.
 */
export function AccountMenu({ labels }: AccountMenuProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  /*
   * The header reads the session in the browser so the storefront can stay
   * statically rendered, and the browser cannot see `Customer.role` — that
   * lives behind Prisma. But the owner is decided by a literal address, so
   * the same question can be asked here. This only decides whether the link
   * is drawn; `proxy.ts` and the admin layout still do the deciding that
   * matters, and neither of them trusts anything sent from here.
   */
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const nameOf = (user: { email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!user) return null;
      const fullName = user.user_metadata?.full_name;
      return typeof fullName === "string" && fullName ? fullName : (user.email ?? "");
    };

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setDisplayName(nameOf(data.user));
      setEmail(data.user?.email ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setDisplayName(nameOf(session?.user ?? null));
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!displayName) {
    return (
      <>
        <Link
          href={`/login`}
          className={buttonStyles({
            variant: "secondary",
            size: "md",
            className: "ms-1 hidden lg:inline-flex",
          })}
        >
          <UserRound aria-hidden className="size-4" strokeWidth={1.75} />
          {labels.login}
        </Link>

        <Link
          href={`/login`}
          aria-label={labels.account}
          title={labels.account}
          className="inline-flex size-10 items-center justify-center border border-transparent text-on-surface transition-colors hover:border-line hover:bg-state-hover lg:hidden"
        >
          <UserRound aria-hidden className="size-5" strokeWidth={1.75} />
        </Link>
      </>
    );
  }

  const items = [
    { href: `/account`, label: labels.profile, icon: UserRound },
    { href: `/account/orders`, label: labels.orders, icon: Package },
    { href: `/account/wishlist`, label: labels.wishlist, icon: Heart },
    { href: `/account/reviews`, label: labels.reviews, icon: Star },
    { href: `/account/addresses`, label: labels.addresses, icon: MapPin },
  ];

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    /*
     * Fluent's Menu. The hand-rolled dropdown had `role="menu"` but none of the
     * behaviour that role promises: no arrow-key navigation, no typeahead, no
     * focus return to the trigger, and its outside-click and Escape handling
     * were written by hand. All of that now comes from the component.
     */
    <Menu positioning="below-end">
      <MenuTrigger disableButtonEnhancement>
        <button
          type="button"
          /*
           * The name and the chevron are hidden below `lg`, which left the
           * avatar — and the avatar is aria-hidden, so the button had no
           * accessible name at all on a phone. It went unseen because the
           * public pages are scanned signed out, where this branch does not
           * render.
           */
          aria-label={labels.account}
          className={cn(
            "flex items-center gap-2 rounded-md border border-transparent px-2 py-1",
            "transition-colors duration-100 ease-fluent hover:bg-state-hover",
          )}
        >
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-container text-label-md font-semibold text-on-primary-container"
          >
            {displayName.slice(0, 1)}
          </span>
          <span className="hidden max-w-28 truncate text-body-md text-on-surface lg:inline">
            {displayName}
          </span>
          <ChevronDown
            aria-hidden
            className="hidden size-4 text-muted lg:block"
            strokeWidth={1.75}
          />
        </button>
      </MenuTrigger>

      <MenuPopover>
        <div className="px-3 py-2">
          <p className="label-mono text-muted">{labels.signedInAs}</p>
          <p className="truncate text-body-md font-semibold text-on-surface">
            {displayName}
          </p>
        </div>
        <MenuDivider />

        <MenuList>
          {isOwner(email) ? (
            <>
              <MenuItemLink
                icon={
                  <LayoutDashboard aria-hidden className="size-4" strokeWidth={1.75} />
                }
                href={`/admin`}
              >
                {labels.adminPanel}
              </MenuItemLink>
              <MenuDivider />
            </>
          ) : null}

          {items.map((item) => (
            <MenuItemLink
              key={item.href}
              icon={<item.icon aria-hidden className="size-4" strokeWidth={1.75} />}
              href={item.href}
            >
              {item.label}
            </MenuItemLink>
          ))}

          <MenuDivider />

          <MenuItem
            icon={
              <LogOut aria-hidden className="size-4 rtl:rotate-180" strokeWidth={1.75} />
            }
            onClick={signOut}
          >
            {labels.logout}
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}