// / — the public landing page. (Design foundation, Slice 1: "dark outside".)
//
// Server Component. Before rendering, validate the session: a signed-in user is
// already through the gate, so we send them straight to /listings rather than
// show them the pitch again. That redirect is unchanged — this slice is styling
// and copy only.
//
// The direction (approved mockup v8, Dark Outside / Light Inside): the landing
// is the outside of the building — park-green, photographic, editorial. Every
// product screen behind the gate is bone-light. Layout, spacing, type sizes and
// copy all come from
// outputs/Manhattanite_Mockup_v8_Dark-Outside-Light-Inside.html.
//
// SiteNav (mounted in the root layout) stands down on "/" — the hero carries
// its own nav overlaid on the photograph. See proxy.ts and SiteNav.tsx.
//
// "On the network" shows the 4 most recent REAL published listings — shown, not
// claimed. Published rows are anon-readable (migration 0010, the teaser policy)
// and the images bucket allows anon read (migration 0018), so this works
// logged-out. Same table and same policies as before; the select just carries
// the extra columns the new card renders. Zero listings hides the section.
//
// The previous landing's hand-drawn skyline lives on in
// app/components/SkylineMark.tsx — unmounted, but kept.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { toCardData, type ListingRow } from "@/lib/listings/card";
import ListingCard from "@/app/components/ListingCard";
import BoxButton from "@/app/components/BoxButton";
import ArrowLink from "@/app/components/ArrowLink";
import SiteFooter from "@/app/components/SiteFooter";

export const dynamic = "force-dynamic"; // session state varies per request.

// The hero photograph, lifted from the approved v8 mockup. Served from public/
// (no signed URL) so the landing paints without a round-trip to Storage.
// TODO(phase-4): replace hero photo — this is 1400×789, fine at 1x but soft on
// a large retina display. Wants a licensed 2400px+ original.
const HERO_SRC = "/hero-brownstone.jpg";

// Gradient scrim: dark at the top so the wordmark and nav read against sky,
// nearly clear through the middle so the building shows, then closing into park
// green at the base so the hero dissolves into the page rather than ending.
const HERO_SCRIM =
  "linear-gradient(to bottom, rgba(10,14,10,.5) 0%, rgba(10,14,10,.12) 38%, rgba(10,14,10,.15) 60%, rgba(19,36,27,.96) 100%)";

const HERO_LINK = "mh-label text-bone/90 hover:text-bone transition-colors";

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

  // Four, because the band is a 2×2 grid.
  const { data: glimpse } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, created_at, images, details, is_example"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(4)
    .returns<ListingRow[]>();

  const listings = glimpse ?? [];

  // Sign every cover image in one round-trip, then look up per card.
  const coverPaths = listings
    .map((l) => l.images?.[0]?.path)
    .filter((p): p is string => Boolean(p));
  const coverUrlByPath = await signImagePaths(coverPaths);

  return (
    <div className="mh-dark">
      <main>
        {/* ================= HERO ================= */}
        <header className="relative h-[92vh] min-h-[560px] overflow-hidden">
          {/* Decorative; the statement below carries the meaning. Plain <img>
              rather than next/image — this is a single above-the-fold hero from
              public/, and the art direction is a full-bleed cover crop. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_SRC}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
          />
          <div
            className="absolute inset-0"
            style={{ background: HERO_SCRIM }}
            aria-hidden="true"
          />

          <div className="absolute inset-0 z-10 flex flex-col justify-between px-10 pt-7 pb-14 max-[860px]:px-[22px] max-[860px]:pt-[22px] max-[860px]:pb-10">
            <nav className="flex items-baseline justify-between gap-6">
              <span className="font-serif text-[24px] text-bone">
                Manhattan<span className="italic">ite</span>
              </span>
              <div className="flex gap-5 sm:gap-[34px]">
                <Link href="/listings" className={HERO_LINK}>
                  Listings
                </Link>
                {/* Three links plus the wordmark don't fit on a phone. This one
                    goes first: the hero's own "Apply for membership" button is
                    the same destination, one thumb-length below. */}
                <a
                  href="#membership"
                  className={`${HERO_LINK} max-[560px]:hidden`}
                >
                  Membership
                </a>
                <Link href="/login" className={HERO_LINK}>
                  Sign in
                </Link>
              </div>
            </nav>

            <div className="max-w-[600px] mh-fade-in">
              <h1 className="font-serif font-normal text-[46px] max-[860px]:text-[32px] leading-[1.12] text-bone mb-6">
                A private marketplace for the people who define New York.
              </h1>
              <div className="flex flex-wrap items-center gap-x-[26px] gap-y-4">
                <BoxButton href="#membership" surface="dark">
                  Apply for membership
                </BoxButton>
                <ArrowLink href="/listings" surface="dark">
                  Browse the network
                </ArrowLink>
              </div>
            </div>
          </div>
        </header>

        {/* ================= ON THE NETWORK ================= */}
        {listings.length > 0 && (
          <section className="mh-gutter mt-24">
            <div className="mh-rule mh-section-grid">
              <p className="mh-label text-bone">On the network</p>
              <div>
                <p className="max-w-[520px] text-[16px] leading-[1.6] text-bone/85 mb-11">
                  From verified neighbors. Every listing is posted by a member,
                  vouched for by a member, and reviewed before it goes live.
                </p>

                <div className="mh-card-grid">
                  {listings.map((row) => {
                    const coverPath = row.images?.[0]?.path;
                    const coverUrl = coverPath
                      ? coverUrlByPath.get(coverPath) ?? null
                      : null;
                    return (
                      <ListingCard
                        key={row.id}
                        listing={toCardData(row, coverUrl)}
                        surface="dark"
                      />
                    );
                  })}
                </div>

                <div className="flex justify-end mt-10">
                  <ArrowLink href="/listings" surface="dark">
                    All listings
                  </ArrowLink>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= MEMBERSHIP ================= */}
        <section id="membership" className="mh-gutter mt-24 scroll-mt-10">
          <div className="mh-rule mh-section-grid">
            <p className="mh-label text-bone">Membership</p>
            <div>
              <h2 className="font-serif font-normal text-[38px] max-[860px]:text-[30px] leading-[1.18] max-w-[20ch] text-bone mb-5">
                Manhattan already trusts Manhattan. We just wrote it down.
              </h2>
              <p className="text-bone/60 max-w-[52ch] mb-[34px]">
                Membership is by application and approval. Every member is
                sponsored by another member, and the sponsor&apos;s name stands
                next to everything they post. No spam, no strangers, no noise.
              </p>

              {/* The boxed email row. A plain GET form to /signup — creating an
                  account is still the first step of applying, and this slice
                  adds no backend. */}
              <form
                action="/signup"
                method="get"
                className="flex max-w-[520px] max-[520px]:flex-col max-[520px]:gap-3"
              >
                <label htmlFor="apply-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="apply-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="flex-1 min-w-0 border border-bone/75 border-r-0 max-[520px]:border-r bg-transparent px-4 py-[14px] text-[14px] text-bone outline-none placeholder:text-bone/45 focus-visible:border-bone"
                />
                <BoxButton surface="dark" type="submit" className="py-[14px]">
                  Apply
                </BoxButton>
              </form>

              <p className="text-[12.5px] text-bone/55 mt-3">
                Applications are reviewed personally. Already a member?{" "}
                <Link
                  href="/login"
                  className="text-bone/80 underline underline-offset-[3px]"
                >
                  Sign in
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter surface="dark" />
    </div>
  );
}
