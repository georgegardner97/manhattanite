// /listings/[id] — read-only listing detail, teaser-aware.
//
// Server Component. RLS returns published rows; a draft, archived, or
// non-existent id resolves to no row → notFound().
//
// Logged-out (guest) visibility mirrors the /listings teaser (D1 decision):
// a guest may view a detail page ONLY if the listing is within the teaser set
// (the 6 most recent published). Any other detail → redirect to /signup. Logged-in
// accounts and members view any published listing.
//
// Layout (design foundation, Slice 2 — steal 10, "anchor rail + statement", in
// its light form): the label column of the section grammar becomes the rail
// (the LISTING label and the way back), and the content column carries the
// whole listing — kicker, statement title with price, the lead photograph at
// full content width, description, metadata, byline, and one boxed action.
//
// The lead photo is deliberately NOT the card's 4:3. A detail page is where you
// look properly at the thing; cropping it to the same ratio as the thumbnail
// wastes the one screen that exists to show it. It runs to the content width
// and is capped at 640px tall so a portrait shot can't push everything else
// below the fold.
//
// Type-specific detail layouts come later; for now the jsonb details render as
// label/value rows, hairline-separated.

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { renderByline } from "@/lib/listings/byline";
import { formatPostedDate } from "@/lib/listings/card";
import ContactModal from "@/app/components/ContactModal";
import ArrowLink from "@/app/components/ArrowLink";
import BoxButton from "@/app/components/BoxButton";
import SiteFooter from "@/app/components/SiteFooter";
import MetaRows from "@/app/components/MetaRows";

export const dynamic = "force-dynamic"; // session state varies per request.

type ListingImage = { path: string };

type ListingDetail = {
  id: string;
  type: "apartment" | "furniture" | "other" | "service";
  title: string;
  description: string;
  price_cents: number;
  created_at: string;
  details: Record<string, unknown>;
  images: ListingImage[];
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

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guests may only see detail for a teaser listing (the 6 most recent
  // published). Everything else sends them to signup. Anon read of published
  // rows is enabled by migration 0010; the teaser cap is enforced here.
  if (!user) {
    const { data: teaser } = await supabase
      .from("listings")
      .select("id")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<{ id: string }[]>();

    const inTeaser = teaser?.some((t) => t.id === id) ?? false;
    if (!inTeaser) {
      redirect("/signup");
    }
  }

  const { data: listing } = await supabase
    .from("listings")
    .select(
      // created_at joins the select for the kicker's posted date — same row,
      // same RLS policy, no new reach.
      "id, type, title, description, price_cents, created_at, details, images, author_id, author_name, sponsor_names, is_example"
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle<ListingDetail>();

  if (!listing) {
    notFound();
  }

  const detailEntries = Object.entries(listing.details ?? {});

  // The kicker's place slot, same rule as the card: neighborhood when there is
  // one, otherwise nothing (the category is already in the row beside it).
  const rawNeighborhood = listing.details?.neighborhood;
  const neighborhood =
    typeof rawNeighborhood === "string" && rawNeighborhood.trim()
      ? rawNeighborhood.trim()
      : null;

  // EXAMPLE tag first, then the plain facts. Assembled as an array so the
  // middot separators fall between whatever actually exists — a listing with no
  // neighborhood must not render a dangling divider.
  const kickerFacts = [
    TYPE_LABEL[listing.type],
    neighborhood,
    formatPostedDate(listing.created_at),
  ].filter((f): f is string => Boolean(f));

  // Sign every image path in one round-trip. Map order is preserved by the
  // paths we pass in; we re-walk listing.images so display order is the
  // poster's chosen order.
  const imagePaths = (listing.images ?? [])
    .map((i) => i.path)
    .filter((p): p is string => Boolean(p));
  const urlByPath = await signImagePaths(imagePaths);
  const imageUrls = imagePaths
    .map((p) => urlByPath.get(p))
    .filter((u): u is string => Boolean(u));

  // The contact CTA needs the viewer's tier. Only fetch for a logged-in
  // non-owner — the owner sees Edit, guests see "Sign in to message". RLS
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

  return (
    <>
      <main className="mh-gutter pt-14 max-[860px]:pt-9">
        <div className="mh-section-grid">
          {/* The rail: what this page is, and the way back. */}
          <aside>
            <p className="mh-label text-ink">Listing</p>
            <ArrowLink
              href="/listings"
              direction="back"
              className="mt-3.5 max-[860px]:mt-2"
            >
              Listings
            </ArrowLink>
          </aside>

          <div className="min-w-0">
            {/* Kicker — the facts, quietly, above the statement. */}
            <div className="mh-label flex flex-wrap items-center gap-x-3.5 gap-y-2 text-slate mb-[18px]">
              {/* Honest label on seed content — looks like the network, isn't
                  a live deal. Full contrast against the muted row around it. */}
              {listing.is_example && (
                <span className="border border-ink/45 px-[7px] py-[2px] text-ink">
                  Example
                </span>
              )}
              {kickerFacts.map((fact, i) => (
                <span key={fact} className="flex items-center gap-x-3.5">
                  {i > 0 && <span aria-hidden="true">&middot;</span>}
                  {fact}
                </span>
              ))}
            </div>

            {/* The statement: title left, price right, closed by a hairline. */}
            <div className="flex items-baseline justify-between gap-8 max-[860px]:flex-col max-[860px]:gap-2 border-b border-ink/16 pb-7">
              <h1 className="font-serif font-normal text-[46px] max-[860px]:text-[32px] leading-[1.08] text-ink">
                {listing.title}
              </h1>
              <p className="text-[17px] font-medium tabular-nums whitespace-nowrap text-ink">
                {formatPrice(listing.price_cents, listing.type)}
              </p>
            </div>

            {/* The lead photograph, then any others beneath it at the same
                width. Signed URLs, in the poster's chosen order — unchanged. */}
            {imageUrls.length > 0 && (
              <div className="mt-9 space-y-4">
                {imageUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="w-full max-h-[640px] object-cover block bg-[#EAE4D8]"
                  />
                ))}
              </div>
            )}

            <p className="font-serif text-[20px] leading-[1.55] max-w-[62ch] mt-10 text-ink whitespace-pre-wrap">
              {listing.description}
            </p>

            <MetaRows
              className="mt-11 max-w-[520px]"
              rows={detailEntries.map(([key, value]) => ({
                label: humanizeKey(key),
                value: formatDetailValue(value),
              }))}
            />

            <p className="mh-label mt-10 text-slate">
              {renderByline(listing.author_name, listing.sponsor_names)}
            </p>

            {/* The page's single primary action, boxed. The gating is
                unchanged — four cases, decided server-side:
                  - owner → Edit (you can't message yourself; the fn rejects it)
                  - member → the contact form, in the modal
                  - logged-in account (Tier 1) → the members-only gate, in the modal
                  - guest → "Sign in to message" → /login, so the label sets the
                    expectation instead of bouncing them to a bare login screen.
                The /listings/[id]/contact route stays live as a no-JS fallback. */}
            {/* No bottom margin — SiteFooter brings its own 120px, and the
                two together left a hole twice the size of any other gap. */}
            <div className="mt-[22px]">
              {isOwner ? (
                <BoxButton href={`/listings/${listing.id}/edit`} surface="light">
                  Edit listing
                </BoxButton>
              ) : viewerIsMember ? (
                <ContactModal
                  mode="form"
                  listingId={listing.id}
                  listerName={listing.author_name ?? "this member"}
                  senderName={viewerName}
                  senderEmail={user?.email ?? ""}
                />
              ) : user ? (
                <ContactModal
                  mode="gate"
                  listerName={listing.author_name ?? "this member"}
                />
              ) : (
                <BoxButton href="/login" surface="light">
                  Sign in to message
                </BoxButton>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter surface="light" />
    </>
  );
}
