// SiteFooter — the editorial footer, in dark and light variants.
//
// Design foundation, Slice 1. Same structure on both surfaces (v8 mockup):
// a hairline rule, then a four-column grid — wordmark + contact block, then
// three link columns under small-caps heads — and a legal line beneath.
//
//   dark  → the landing page ("outside"), park background, bone type
//   light → the product screens ("inside"), bone background, park type
//
// `surface` picks the palette. The Membership column is chosen separately, from
// the viewer's TIER — same three-tier model as SiteNav (the trust gate is at the
// action layer, so the footer must never advertise a door the viewer can't open:
// no "Post a listing" for a guest browsing the teaser). Every href points at a
// route that exists today — this slice changes styling and copy, not the sitemap.

import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

type FooterLink = { label: string; href: string };

const BROWSE: FooterLink[] = [
  { label: "All listings", href: "/listings" },
  { label: "Apartments", href: "/listings?type=apartment" },
  { label: "Furniture", href: "/listings?type=furniture" },
];

// Mirrors SiteNav's tiers: guest → the two front doors; account (Tier 1) → the
// conversion CTA plus their profile; member (Tier 2) → the things they can
// actually do.
const MEMBERSHIP_BY_TIER: Record<Viewer, FooterLink[]> = {
  guest: [
    { label: "Apply", href: "/signup" },
    { label: "Sign in", href: "/login" },
  ],
  account: [
    { label: "Apply for membership", href: "/apply" },
    { label: "My profile", href: "/profile" },
  ],
  member: [
    { label: "My profile", href: "/profile" },
    { label: "My listings", href: "/listings/mine" },
    { label: "Post a listing", href: "/listings/new" },
  ],
};

type Viewer = "guest" | "account" | "member";

const INFO: FooterLink[] = [
  { label: "Contact", href: "mailto:info@manhattanite.com" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

const SURFACE = {
  dark: {
    body: "text-bone/85",
    wordmark: "text-bone",
    head: "text-bone border-bone/16",
    legal: "border-bone/16 text-bone/50",
  },
  light: {
    body: "text-park",
    wordmark: "text-park",
    head: "text-park border-ink/16",
    legal: "border-ink/16 text-slate",
  },
} as const;

export default async function SiteFooter({
  surface = "light",
}: {
  surface?: keyof typeof SURFACE;
}) {
  const s = SURFACE[surface];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewer: Viewer = "guest";
  if (user) {
    // RLS "read own row" allows this. A missing row (signup race) falls back to
    // 'account' — logged in but not yet a member.
    const { data: account } = await supabase
      .from("accounts")
      .select("is_member")
      .eq("id", user.id)
      .single<{ is_member: boolean }>();
    viewer = account?.is_member ? "member" : "account";
  }

  const membership = MEMBERSHIP_BY_TIER[viewer];

  return (
    <footer className={`mh-gutter mt-[120px] pb-[46px] ${s.body}`}>
      <div className="mh-rule pt-[34px] grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 max-[860px]:grid-cols-1">
        <div>
          <div className={`font-serif text-[22px] ${s.wordmark}`}>
            Manhattan<span className="italic">ite</span>
          </div>
          <div className="text-[14px] leading-[1.7] mt-[22px]">
            <a
              href="mailto:info@manhattanite.com"
              className="hover:underline underline-offset-4"
            >
              info@manhattanite.com
            </a>
            <br />
            Made in the East Village,
            <br />
            New York, NY
          </div>
        </div>

        <FooterColumn title="Browse" links={BROWSE} headClass={s.head} />
        <FooterColumn title="Membership" links={membership} headClass={s.head} />
        <FooterColumn title="Info" links={INFO} headClass={s.head} />
      </div>

      <div
        className={`flex justify-between gap-6 max-[860px]:flex-col max-[860px]:gap-2 mt-[52px] pt-[18px] border-t text-[12.5px] ${s.legal}`}
      >
        <span>&copy; Manhattanite 2026. All rights reserved.</span>
        <span>New York&rsquo;s trusted private marketplace.</span>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  headClass,
}: {
  title: string;
  links: FooterLink[];
  headClass: string;
}) {
  return (
    <div>
      <span className={`mh-label block border-b pb-[10px] mb-4 ${headClass}`}>
        {title}
      </span>
      <ul>
        {links.map((link) => (
          <li key={link.label} className="mb-[9px] text-[14px]">
            <FooterLinkItem href={link.href}>{link.label}</FooterLinkItem>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterLinkItem({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const className = "hover:underline underline-offset-4";
  return href.startsWith("/") ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
