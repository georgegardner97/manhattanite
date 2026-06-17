// / — the public landing page. (Phase 1.5 landing rework, mockup v3.)
//
// Server Component. Before rendering, validate the session: a signed-in user
// is already through the gate, so we send them straight to /listings (the feed
// is the home of the marketplace) rather than show them the pitch again — the
// reverse of what /profile does for logged-out visitors.
//
// v3 replaces the thin Slice 3.5 gating page with the narrative landing —
// plainer, warmer, trust-first (Gens de Confiance-aligned: benefit →
// mechanism → reassurance). Copy and structure come verbatim from
// outputs/Manhattanite_Landing-Page_Mockup_v3.html, translated into the
// app's design system. American spelling throughout.
//
// "On the network" shows the 5 most recent REAL published listings — shown,
// not claimed. Published rows are anon-readable (migration 0010, the teaser
// policy), so the query works logged-out. Each row is display-only (no link —
// the Browse CTA is the only way in, like GDC's non-clickable teasers), shows
// no timestamp (deliberate: at low volume it reads as curated, not stale),
// and takes its place label from the listing's own details->>'neighborhood' —
// NOT from an author embed (a PostgREST FK embed here is what broke the
// member directory). Furniture rows simply omit the place. Zero published
// listings hides the whole section.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";

export const dynamic = "force-dynamic"; // session state varies per request.

const LABEL = "text-[11px] tracking-[0.26em] uppercase text-slate";

type ListingImage = { path: string };

type GlimpseListing = {
  id: string;
  type: "apartment" | "furniture" | "other" | "service";
  title: string;
  price_cents: number;
  images: ListingImage[] | null;
  details: Record<string, unknown> | null;
};

function placeOf(listing: GlimpseListing): string | null {
  const neighborhood = listing.details?.neighborhood;
  return typeof neighborhood === "string" && neighborhood.trim()
    ? neighborhood
    : null;
}

function formatPrice(cents: number, type: GlimpseListing["type"]): string {
  const dollars = Math.round(cents / 100).toLocaleString("en-US");
  return type === "apartment" ? `$${dollars}/mo` : `$${dollars}`;
}

export default async function Home() {
  const supabase = await createClient();

  // getUser() validates the session against Supabase Auth on every call —
  // safer than getSession() which trusts whatever is in the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Already through the gate — don't show the pitch again. Land them on the
    // network (the listings are the value), not their profile.
    redirect("/listings");
  }

  // The glimpse: 3 most recent live listings, shown as a restrained image band
  // (GDC leads with real listing photos — the cards are the proof). Three keeps
  // it curated rather than thin at low volume.
  const { data: glimpse } = await supabase
    .from("listings")
    .select("id, type, title, price_cents, images, details")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(3)
    .returns<GlimpseListing[]>();

  const listings = glimpse ?? [];

  // Sign each card's cover image in one round-trip. Anon read of the
  // listing-images bucket is allowed by migration 0018, so this works
  // logged-out — without it the band would render empty frames.
  const coverPaths = listings
    .map((l) => l.images?.[0]?.path)
    .filter((p): p is string => Boolean(p));
  const coverUrlByPath = await signImagePaths(coverPaths);

  return (
    <>
      <main>
        {/* ============ HERO — benefit → mechanism → reassurance ============ */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-20">
          <h1 className="mh-fade-in font-serif font-extralight text-7xl md:text-9xl tracking-tighter leading-none">
            Manhattan<span className="italic">ite</span>
          </h1>

          {/* Hand-drawn NYC skyline — the editorial masthead signature
              (brownstone roofline + water towers). Decorative, so aria-hidden. */}
          <div
            className="mh-fade-in w-[min(440px,84%)] mx-auto mt-8 text-ink"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 480 150"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.3}
              strokeLinecap="square"
              strokeLinejoin="miter"
              className="w-full h-auto block"
            >
              <line x1="6" y1="140" x2="474" y2="140" />
              <path d="M30 140 V70 H92 V58 H150 V84 H210 V64 H276 V52 H338 V80 H398 V66 H452 V140" />
              <line x1="30" y1="76" x2="92" y2="76" />
              <line x1="92" y1="64" x2="150" y2="64" />
              <line x1="150" y1="90" x2="210" y2="90" />
              <line x1="210" y1="70" x2="276" y2="70" />
              <line x1="276" y1="58" x2="338" y2="58" />
              <line x1="338" y1="86" x2="398" y2="86" />
              <line x1="398" y1="72" x2="452" y2="72" />
              <rect x="44" y="92" width="12" height="16" />
              <rect x="66" y="92" width="12" height="16" />
              <rect x="44" y="116" width="12" height="16" />
              <rect x="66" y="116" width="12" height="16" />
              <rect x="108" y="80" width="12" height="16" />
              <rect x="128" y="80" width="12" height="16" />
              <rect x="108" y="104" width="12" height="16" />
              <rect x="128" y="104" width="12" height="16" />
              <rect x="232" y="86" width="12" height="16" />
              <rect x="252" y="86" width="12" height="16" />
              <rect x="232" y="110" width="12" height="16" />
              <rect x="252" y="110" width="12" height="16" />
              <rect x="356" y="100" width="12" height="16" />
              <rect x="376" y="100" width="12" height="16" />
              <rect x="416" y="88" width="12" height="16" />
              <g>
                <path d="M296 52 l9 -16 h26 l9 16 Z" />
                <rect x="298" y="52" width="34" height="20" />
                <line x1="302" y1="72" x2="300" y2="80" />
                <line x1="328" y1="72" x2="330" y2="80" />
              </g>
              <g>
                <path d="M118 58 l7 -12 h20 l7 12 Z" />
                <rect x="120" y="58" width="28" height="16" />
              </g>
            </svg>
          </div>

          <p className="mh-fade-in font-serif text-2xl md:text-[28px] leading-[1.35] text-ink mt-7">
            A private marketplace for New York.
          </p>
          <p className="mh-fade-in max-w-[430px] text-slate leading-[1.75] mt-5">
            You&apos;re brought in by someone who vouches for you. It&apos;s why
            there are no scams, no spam, and no strangers.
          </p>

          <div className="mh-fade-in-delay mt-11">
            <Link
              href="/signup"
              className="mh-link mh-link-park text-[13px] tracking-[0.22em] uppercase text-ink"
            >
              Create a free account &rarr;
            </Link>
          </div>
          <p className="mh-fade-in-delay mt-6 text-[11px] tracking-[0.18em] uppercase text-slate">
            Free to join
          </p>
        </section>

        {/* ============ ON THE NETWORK — a restrained band of real listings ===
            Shown, not claimed. Display-only (no link — the Browse CTA is the
            only way in, like GDC's non-clickable teasers). Zero listings hides
            the whole section. */}
        {listings.length > 0 && (
          <section className="pb-24">
            <div className="max-w-2xl mx-auto px-7">
              <p className={`${LABEL} mb-9 text-center`}>On the network</p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {listings.map((listing) => {
                  const place = placeOf(listing);
                  const coverPath = listing.images?.[0]?.path;
                  const coverUrl = coverPath
                    ? coverUrlByPath.get(coverPath) ?? null
                    : null;
                  return (
                    <li key={listing.id}>
                      <div className="aspect-[4/3] overflow-hidden bg-ink/5">
                        {coverUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={coverUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      {place && (
                        <p className="mt-3.5 text-[10px] tracking-[0.18em] uppercase text-slate">
                          {place}
                        </p>
                      )}
                      <p className="mt-1 font-serif text-[15px] leading-snug text-ink">
                        {listing.title}
                      </p>
                      <p className="mt-0.5 text-[13px] text-slate">
                        {formatPrice(listing.price_cents, listing.type)}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-12 text-center">
                <Link
                  href="/listings"
                  className="mh-link text-[12px] tracking-[0.22em] uppercase text-slate"
                >
                  Browse the network &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ============ HOW IT WORKS ============ */}
        <section className="py-26">
          <div className="max-w-[600px] mx-auto px-7 text-center">
            <p className={`${LABEL} mb-6`}>How it works</p>
            <h2 className="font-serif font-light text-4xl md:text-[42px] leading-[1.15] tracking-tight text-ink max-w-[520px] mx-auto">
              Everyone here was vouched for.
            </h2>
            <p className="text-lg leading-[1.8] text-slate max-w-[500px] mx-auto mt-6">
              A member has to bring you in and vouch for you. So everyone here is
              someone another member trusts, and every listing is checked by a
              person before it goes live.{" "}
              <span className="text-ink">
                Nothing reaches you that a person hasn&apos;t checked first.
              </span>
            </p>
          </div>
        </section>

        {/* ============ QUIET PRIVACY ASIDE ============ */}
        <div className="py-21 px-7 text-center">
          <p className="font-serif text-2xl md:text-[26px] leading-[1.4] text-ink max-w-[460px] mx-auto">
            Private, in the literal sense.
          </p>
          <p className="text-base leading-[1.7] text-slate mt-4 max-w-[440px] mx-auto">
            The network is closed to search engines. What&apos;s here stays
            between members.
          </p>
        </div>

        {/* ============ CLOSING CTA — one door: start with an account ============
            Replaces the old "Two ways in" Account/Member split. George's call
            (2026-06-16): don't advertise two doors up front. Membership is a
            later step you discover once you're in, not a parallel entrance. */}
        <section className="py-26">
          <div className="max-w-[560px] mx-auto px-7 text-center">
            <h2 className="font-serif font-light text-3xl md:text-[34px] leading-[1.2] tracking-tight text-ink">
              Start with an account.
            </h2>
            <p className="text-lg leading-[1.8] text-slate max-w-[460px] mx-auto mt-5">
              It&apos;s free, and it lets you browse the whole network. Posting,
              messaging, and sponsoring come later, once you&apos;re a member.
            </p>
            <div className="mt-9">
              <Link
                href="/signup"
                className="mh-link mh-link-park text-[13px] tracking-[0.22em] uppercase text-ink"
              >
                Create a free account &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-ink/10 px-6 py-16 text-center">
        <div className="max-w-5xl mx-auto">
          <p className="font-serif font-extralight text-3xl tracking-tight">
            Manhattan<span className="italic">ite</span>
          </p>
          <p className="mt-3 text-[10px] tracking-[0.32em] uppercase text-slate">
            For New Yorkers
          </p>

          <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10 text-[11px] tracking-[0.12em] uppercase text-slate">
            <a href="mailto:info@manhattanite.com" className="hover:text-ink transition-colors">
              Contact
            </a>
            <span className="hidden md:block w-px h-3 bg-ink/15" />
            <span>New York City</span>
            <span className="hidden md:block w-px h-3 bg-ink/15" />
            <a href="/privacy" className="hover:text-ink transition-colors">Privacy</a>
            <span className="hidden md:block w-px h-3 bg-ink/15" />
            <a href="/terms" className="hover:text-ink transition-colors">Terms</a>
            <span className="hidden md:block w-px h-3 bg-ink/15" />
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </>
  );
}
