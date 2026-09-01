"use client";

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
import { useEffect, useRef, useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

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
          <UserRound aria-hidden className="size-4" strokeWidth={2} />
          {labels.login}
        </Link>

        <Link
          href={`/${locale}/login`}
          aria-label={labels.account}
          title={labels.account}
          className="inline-flex size-10 items-center justify-center border border-transparent text-on-surface transition-colors hover:border-line hover:bg-surface-high lg:hidden"
        >
          <UserRound aria-hidden className="size-5" strokeWidth={2} />
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
    setIsOpen(false);
    router.replace(`/${locale}`);
    router.refresh();
  };

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-2 border px-2 py-1.5 transition-colors",
          isOpen
            ? "border-line bg-surface-high"
            : "border-transparent hover:border-line hover:bg-surface-high",
        )}
      >
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center border border-line bg-primary-container font-display text-sm font-bold text-on-primary-container"
        >
          {displayName.slice(0, 1)}
        </span>
        <span className="hidden max-w-28 truncate text-label-md text-on-surface lg:inline">
          {displayName}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "hidden size-4 text-muted transition-transform lg:block",
            isOpen && "rotate-180",
          )}
          strokeWidth={2}
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute end-0 top-[calc(100%+0.5rem)] z-50 w-60 border-2 border-line bg-card shadow-hard"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="label-mono text-muted">{labels.signedInAs}</p>
            <p className="truncate text-body-md font-semibold text-on-surface">
              {displayName}
            </p>
          </div>

          <ul className="py-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-body-md text-on-surface-variant transition-colors hover:bg-surface-high hover:text-on-surface"
                >
                  <item.icon aria-hidden className="size-4 shrink-0" strokeWidth={2} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5 text-body-md text-error transition-colors hover:bg-error-container hover:text-on-error-container"
          >
            <LogOut aria-hidden className="size-4 shrink-0 rtl:rotate-180" strokeWidth={2} />
            {labels.logout}
          </button>
        </div>
      ) : null}
    </div>
  );
}
