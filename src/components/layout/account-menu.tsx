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
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface AccountMenuProps {
  locale: string;
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
  };
}

/**
 * Header account control. The session is read in the browser so the whole
 * storefront shell can stay statically rendered — only this control changes
 * once Supabase resolves who is signed in.
 */
export function AccountMenu({ locale, labels }: AccountMenuProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const nameOf = (user: { email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!user) return null;
      const fullName = user.user_metadata?.full_name;
      return typeof fullName === "string" && fullName ? fullName : (user.email ?? "");
    };

    supabase.auth.getUser().then(({ data }) => {
      if (active) setDisplayName(nameOf(data.user));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setDisplayName(nameOf(session?.user ?? null));
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
          href={`/${locale}/login`}
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
          href={`/${locale}/login`}
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
    { href: `/${locale}/account`, label: labels.profile, icon: UserRound },
    { href: `/${locale}/account/orders`, label: labels.orders, icon: Package },
    { href: `/${locale}/account/wishlist`, label: labels.wishlist, icon: Heart },
    { href: `/${locale}/account/reviews`, label: labels.reviews, icon: Star },
    { href: `/${locale}/account/addresses`, label: labels.addresses, icon: MapPin },
  ];

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(`/${locale}`);
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