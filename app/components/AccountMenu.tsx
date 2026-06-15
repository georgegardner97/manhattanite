"use client";

// AccountMenu — the avatar dropdown that holds a member's personal links, so
// the top nav stays to Listings + the tier's primary action (GDC's pattern:
// "manage your ads", profile, settings, log out all live under the avatar, not
// in the bar). Client component because it owns open/close state.
//
// Holds: Profile, My listings (members only), Admin (admins only), Log out.
// The avatar is the member's first initial until profile photos exist.

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const ITEM =
  "block w-full text-left px-5 py-3 text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink hover:bg-ink/[0.04] transition-colors cursor-pointer";

export default function AccountMenu({
  name,
  isMember,
  isAdmin,
}: {
  name: string | null;
  isMember: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = (name?.trim()?.[0] ?? "•").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-1.5 cursor-pointer group"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-full border border-ink/25 text-[12px] font-serif text-ink group-hover:border-ink transition-colors">
          {initial}
        </span>
        <span className="text-[10px] text-slate" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-52 bg-bone border border-ink/15 shadow-[0_8px_30px_rgba(15,14,12,0.08)] z-50 py-1"
        >
          {name && (
            <p className="px-5 py-3 text-[14px] font-serif text-ink border-b border-ink/10 truncate">
              {name}
            </p>
          )}
          <Link
            href="/profile"
            role="menuitem"
            className={ITEM}
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          {isMember && (
            <Link
              href="/listings/mine"
              role="menuitem"
              className={ITEM}
              onClick={() => setOpen(false)}
            >
              My listings
            </Link>
          )}
          {isMember && (
            <Link
              href="/invite"
              role="menuitem"
              className={ITEM}
              onClick={() => setOpen(false)}
            >
              Invite someone
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              className={ITEM}
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          )}
          <form
            action="/auth/sign-out"
            method="post"
            className="border-t border-ink/10"
          >
            <button type="submit" role="menuitem" className={ITEM}>
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
