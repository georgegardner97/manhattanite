// Screen 03 — Listing detail, in the Classifieds system.
//
// The live /listings/[id] page rendered in the design: breadcrumb, a gallery,
// then the listing in a wide column with a sticky card beside it carrying the
// price, the member, and the one real action.
//
// THE GATE IS THE LIVE GATE, COPIED DELIBERATELY RATHER THAN IMPORTED. The
// live page decides four things — whether a guest may see this listing at all,
// and which of four contact affordances to render — and both decisions are
// re-stated here in full. That is duplication with a reason: this is a preview
// of a design, and the day it is deleted the live page must be untouched. A
// shared "detail gate" module would make /listings/[id] depend on app/design,
// which is exactly the coupling this whole directory is built to avoid. The
// gated LIST read is shared (listings-read.ts) because three preview screens
// use it; this one is not, because only one does.
//
// WHERE THE DESIGN AND THE PRODUCT DISAGREE:
//
//   The member block. The design draws a photograph, a name, and "Member since
//   2019". `author_name` is denormalized onto the listing, so the name is free;
//   the avatar and the join date are columns on `accounts`, which is read-own
//   under RLS. See the note on .cl-avatar in classifieds.css — this renders the
//   design's empty circle and the name, and does not invent the rest.
//
//   The chips. Screen 03 shows a row of short facts ("Yamaha U1", "1978",
//   "Bench included") ABOVE the description and a labelled grid below it. Both
//   come from one untyped `details` jsonb bag in reality, and nothing in it says
//   which facts are short enough to be chips. Rendering the same values twice in
//   two shapes would be a mockup, so the labelled grid — which is what the live
//   page already does with this column — carries all of them.

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { formatPostedDate, placeOf } from "@/lib/listings/card";
import { relativeDay } from "@/lib/cl/filters";
import { TEASER_LIMIT } from "@/lib/cl/listings-read";
import AppHeader from "@/app/components/cl/AppHeader";
import SaveButton from "@/app/components/cl/SaveButton";
import ClContactModal from "@/app/components/cl/ClContactModal";
import ClGallery from "@/app/components/cl/ClGallery";
import ClGate from "@/app/components/cl/ClGate";

export const dynamic = "force-dynamic"; // session state varies per request.

type ListingDetail = {
  id: string;
  type: "apartment" | "furniture" | "other" | "service";
  title: string;
  description: string;
  price_cents: number;
  created_at: string;
  details: Record<string, unknown>;
  images: { path: string }[];
  author_id: string;
  author_name: string | null;
  sponsor_names: string[];
  is_example: boolean;
};

const TYPE_LABEL: Record<ListingDetail["type"], string> = {
  apartment: "Apartment",
  furniture: "Furniture",
  other: "Everything else",
  service: "Service",
};

// The type's slug in the browse rail, so the breadcrumb's middle crumb lands on
// a filtered browse rather than an unfiltered one.
const TYPE_HREF: Record<ListingDetail["type"], string> = {
  apartment: "/listings?type=apartment",
  furniture: "/listings?type=furniture",
  other: "/listings?type=other",
  service: "/listings?type=service",
};

function formatPrice(cents: number, type: ListingDetail["type"]): string {
  const dollars = Math.round(cents / 100).toLocaleString("en-US");
  return type === "apartment" ? `$${dollars}/mo` : `$${dollars}`;
}

function humanizeKey(key: string): string {
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatDetailValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default async function ClassifiedsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guests may only see detail for a teaser listing (the most recent published
  // few). Anon read of published rows is enabled by migration 0010; the teaser
  // cap is enforced here, and it is enforced BEFORE the listing is fetched — a
  // refused reader's request never loads the row, so there is nothing to leak
  // into the page below.
  if (!user) {
    const { data: teaser } = await supabase
      .from("listings")
      .select("id")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(TEASER_LIMIT)
      .returns<{ id: string }[]>();

    if (!teaser?.some((t) => t.id === id)) {
      // The live page redirects to /signup here. This renders the design's
      // access wall instead — same refusal, with the reason and both doors on
      // screen. See the note at the top of ClGate.
      return (
        <>
          <AppHeader active="none" />
          <main className="mx-auto w-full max-w-[1100px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(40px,6vw,80px)] pb-[clamp(32px,4vw,56px)]">
            <ClGate
              title="Members only"
              note="This listing is past the few we show publicly. Sign in, or request access."
            />
          </main>
        </>
      );
    }
  }

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, created_at, details, images, author_id, author_name, sponsor_names, is_example"
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle<ListingDetail>();

  // A draft, an archived listing, a bad id — RLS returns no row for all three,
  // and all three mean the same thing to a reader. not-found.tsx renders the
  // design's 404 panel.
  if (!listing) {
    notFound();
  }

  const rawNeighborhood = listing.details?.neighborhood;
  const neighborhood =
    typeof rawNeighborhood === "string" && rawNeighborhood.trim()
      ? rawNeighborhood.trim()
      : null;

  // Neighborhood is already the breadcrumb's last crumb and half the kicker, so
  // it does not also get a row in the grid. Everything else in the bag does.
  const detailEntries = Object.entries(listing.details ?? {}).filter(
    ([key]) => key !== "neighborhood"
  );

  const imagePaths = (listing.images ?? [])
    .map((i) => i.path)
    .filter((p): p is string => Boolean(p));
  const urlByPath = await signImagePaths(imagePaths);
  const imageUrls = imagePaths
    .map((p) => urlByPath.get(p))
    .filter((u): u is string => Boolean(u));

  // The contact affordance needs the viewer's tier. Only fetched for a
  // logged-in non-owner — the owner sees Edit, guests see a sign-in link. RLS
  // read-own returns just this viewer's row.
  const isOwner = !!user && listing.author_id === user.id;
  let viewerIsMember = false;
  let viewerName: string | null = null;
  if (user && !isOwner) {
    const { data: viewer } = await supabase
      .from("accounts")
      .select("is_member, name")
      .eq("id", user.id)
      .single<{ is_member: boolean; name: string | null }>();
    viewerIsMember = viewer?.is_member ?? false;
    viewerName = viewer?.name ?? null;
  }

  const listerName = listing.author_name ?? "this member";

  return (
    <>
      <AppHeader active="none" />

      <main className="mx-auto w-full max-w-[1100px] px-[clamp(16px,2.4vw,28px)] pt-[22px] pb-[clamp(32px,4vw,56px)]">
        {/* Breadcrumb. Every crumb goes somewhere real: browse, browse filtered
            to this category, browse filtered to this neighborhood. */}
        <nav
          aria-label="Breadcrumb"
          className="mb-[18px] flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]"
          style={{ color: "var(--cl-muted)" }}
        >
          <Link href="/listings">Browse</Link>
          <span aria-hidden="true">/</span>
          <Link href={TYPE_HREF[listing.type]}>{TYPE_LABEL[listing.type]}</Link>
          {neighborhood && (
            <>
              <span aria-hidden="true">/</span>
              <Link
                href={`/listings?hood=${encodeURIComponent(neighborhood)}`}
              >
                {neighborhood}
              </Link>
            </>
          )}
        </nav>

        <ClGallery urls={imageUrls} />

        <div className="mt-[clamp(26px,3vw,40px)] grid grid-cols-[1fr_320px] items-start gap-[clamp(28px,4vw,60px)] max-[860px]:grid-cols-1 max-[860px]:gap-8">
          {/* ---------- The listing ---------- */}
          <div className="min-w-0">
            <div className="cl-kicker flex flex-wrap items-center gap-x-2 gap-y-2">
              {/* Seed content, labelled. This survives the change of design
                  system because it is a trust requirement, not a style choice —
                  nobody should mistake an example for a live deal. */}
              {listing.is_example && (
                <span className="cl-chip cl-chip-xs cl-tag-vouched mr-1">
                  Example
                </span>
              )}
              <span>
                {[neighborhood, TYPE_LABEL[listing.type]]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>

            <h1 className="mt-3 text-[clamp(24px,2.6vw,34px)] font-medium leading-[1.14] tracking-[-0.02em]">
              {listing.title}
            </h1>

            {/* whitespace-pre-wrap: the post form takes a textarea, and a
                poster's paragraph breaks are part of what they wrote. */}
            <p
              className="mt-[26px] max-w-[560px] text-[15px] leading-[1.65] whitespace-pre-wrap"
              style={{ color: "var(--cl-body)" }}
            >
              {listing.description}
            </p>

            <dl
              className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-5 border-t pt-6 text-[13.5px]"
              style={{ borderColor: "var(--cl-hairline)" }}
            >
              {detailEntries.map(([key, value]) => (
                <div key={key}>
                  <dt
                    className="mb-1.5 text-[12px]"
                    style={{ color: "var(--cl-faint)" }}
                  >
                    {humanizeKey(key)}
                  </dt>
                  <dd className="m-0">{formatDetailValue(value)}</dd>
                </div>
              ))}

              {/* Always last, and always present — the design's fourth cell.
                  The relative form on the card ("3 days ago") answers "is this
                  fresh?"; on the page you want the date, so both are given. */}
              <div>
                <dt
                  className="mb-1.5 text-[12px]"
                  style={{ color: "var(--cl-faint)" }}
                >
                  Posted
                </dt>
                <dd className="m-0">
                  {formatPostedDate(listing.created_at)}
                  <span style={{ color: "var(--cl-faint)" }}>
                    {" · "}
                    {relativeDay(listing.created_at)}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* ---------- The sticky card ---------- */}
          {/* top-6 pairs with the page's own scroll; there is no fixed header
              above it, so the card can sit close to the top of the viewport. */}
          <aside
            className="sticky top-6 rounded-[12px] border p-[22px] max-[860px]:static"
            style={{
              borderColor: "var(--cl-border-control)",
              background: "var(--cl-white)",
            }}
          >
            <div className="text-[clamp(22px,2.2vw,28px)] tabular-nums">
              {formatPrice(listing.price_cents, listing.type)}
            </div>

            <div
              className="mt-[22px] flex items-center gap-3 border-t pt-5"
              style={{ borderColor: "var(--cl-hairline)" }}
            >
              <div className="cl-avatar h-10 w-10" aria-hidden="true" />
              <div className="min-w-0">
                {/* Through to screen 08. Their profile is assembled from the
                    same public bylines this card is already showing, so the
                    link discloses nothing the page hasn't. */}
                <Link
                  href={`/members/${listing.author_id}`}
                  className="cl-cardlink block truncate text-[14.5px] font-medium"
                >
                  {listerName}
                </Link>
                <div
                  className="text-[12.5px]"
                  style={{ color: "var(--cl-muted)" }}
                >
                  {listing.type === "apartment" ? "Listing" : "Selling"} in{" "}
                  {placeOf(listing)}
                </div>
              </div>
            </div>

            {/* The sponsor line, in the design's quiet inset. renderByline is
                not used here: it assembles "Listed by X · sponsored by Y" as one
                string for a card's meta row, and this block has already given
                the name its own line above. The hybrid-at-2 rule still governs
                how many sponsors are named — see below. */}
            {listing.sponsor_names.length > 0 && (
              <p className="cl-inset mt-4">
                Sponsored by{" "}
                <strong className="font-medium">
                  {formatSponsors(listing.sponsor_names)}
                </strong>
              </p>
            )}

            <div className="mt-[18px] flex flex-col gap-2.5">
              {isOwner ? (
                <Link
                  href={`/listings/${listing.id}/edit`}
                  className="cl-pill w-full"
                >
                  Edit listing
                </Link>
              ) : viewerIsMember ? (
                <ClContactModal
                  mode="form"
                  listingId={listing.id}
                  listerName={listerName}
                  senderName={viewerName}
                  senderEmail={user?.email ?? ""}
                />
              ) : user ? (
                <ClContactModal mode="gate" listerName={listerName} />
              ) : (
                // The label sets the expectation instead of bouncing a guest to
                // a bare login screen from an unlabelled button.
                <Link href="/login" className="cl-pill w-full">
                  Sign in to get in touch
                </Link>
              )}

              <SaveButton
                id={listing.id}
                title={listing.title}
                variant="block"
              />
            </div>

            <p
              className="mt-4 text-[12px] leading-[1.55]"
              style={{ color: "var(--cl-faint)" }}
            >
              Read by a person before it went live. Report anything off and
              we&rsquo;ll take it down.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}

// The hybrid-at-2 rule, in the shape this block needs. lib/listings/byline.ts
// owns the rule for the "Listed by … · sponsored by …" string; the threshold
// and punctuation are restated rather than re-exported because that module's
// public function returns the whole byline, author included, and this card has
// already set the author on his own line.
function formatSponsors(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, 2).join(", ")} + ${names.length - 2} more`;
}
