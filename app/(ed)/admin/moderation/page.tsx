// /admin/moderation — the listing review queue. (Listing Moderation slice.)
//
// Server Component, role='admin' only (requireAdmin). Lists every
// status='pending' listing in full — title, type, price, description,
// type-specific details, photos, byline — oldest first, reviewed in the order
// they arrived (same convention as /admin/applications). Per listing:
// Approve / Return with note / Reject (ModerationActions).
//
// Reads run as the signed-in admin — 0015's listings_admin_read_all policy is
// the data gate; image signing rides the admin's own session (the storage
// read policy already serves any authenticated viewer, same as /listings).

import { requireAdmin } from "@/lib/admin/guard";
import PageShell from "@/app/components/PageShell";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { renderByline } from "@/lib/listings/byline";
import ModerationActions from "@/app/components/ModerationActions";

export const dynamic = "force-dynamic"; // session state varies per request.

type PendingListing = {
  id: string;
  type: "apartment" | "furniture" | "other" | "service";
  title: string;
  description: string;
  price_cents: number | null;
  details: Record<string, unknown>;
  images: { path: string }[];
  author_name: string | null;
  sponsor_names: string[];
  moderation_note: string | null;
  created_at: string;
};

// The ONE screen that says "No price" out loud instead of rendering nothing.
// A moderator has to be able to tell a deliberate blank from a broken row, and
// silence reads as broken. Everywhere a member or a visitor looks, no price
// means no line at all.
function formatPrice(
  cents: number | null,
  type: PendingListing["type"]
): string {
  if (cents === null) return "No price";
  const dollars = Math.round(cents / 100).toLocaleString("en-US");
  return type === "apartment" ? `$${dollars}/mo` : `$${dollars}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

export default async function AdminModerationPage() {
  const { supabase } = await requireAdmin();

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, details, images, author_name, sponsor_names, moderation_note, created_at"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<PendingListing[]>();

  const pending = listings ?? [];

  // Sign every photo of every pending listing in one round-trip.
  const allPaths = pending.flatMap((l) =>
    (l.images ?? []).map((i) => i.path).filter((p): p is string => Boolean(p))
  );
  const urlByPath = await signImagePaths(allPaths);

  return (
    <PageShell
      label="Listings in review"
      title={<>What&rsquo;s waiting to go live.</>}
      backHref="/admin"
      backLabel="Admin"
    >

        {pending.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-px">
            {pending.map((listing) => (
              <li
                key={listing.id}
                className="border-t border-ink/10 py-10 last:border-b"
              >
                <PendingListingCard listing={listing} urlByPath={urlByPath} />
                <ModerationActions listingId={listing.id} />
              </li>
            ))}
          </ul>
        )}
    </PageShell>
  );
}

function PendingListingCard({
  listing,
  urlByPath,
}: {
  listing: PendingListing;
  urlByPath: Map<string, string>;
}) {
  const detailEntries = Object.entries(listing.details ?? {});
  const imageUrls = (listing.images ?? [])
    .map((i) => (i.path ? urlByPath.get(i.path) : undefined))
    .filter((u): u is string => Boolean(u));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-6">
        <h2 className="font-serif font-light text-2xl tracking-tight text-ink">
          {listing.title}
        </h2>
        <p className="font-serif text-xl text-ink whitespace-nowrap">
          {formatPrice(listing.price_cents, listing.type)}
        </p>
      </div>

      <p className="mt-2 text-[11px] tracking-[0.22em] uppercase text-slate">
        {humanizeKey(listing.type)} &middot; submitted{" "}
        {formatDate(listing.created_at)}
      </p>

      {imageUrls.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          {imageUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="w-full aspect-[4/3] object-cover bg-ink/5"
            />
          ))}
        </div>
      )}

      <p className="mt-5 font-serif text-lg text-ink leading-relaxed whitespace-pre-wrap">
        {listing.description}
      </p>

      {detailEntries.length > 0 && (
        <dl className="mt-5 space-y-2">
          {detailEntries.map(([key, value]) => (
            <div key={key} className="flex gap-3 text-sm">
              <dt className="text-[11px] tracking-[0.22em] uppercase text-slate">
                {humanizeKey(key)}
              </dt>
              <dd className="text-ink">{formatDetailValue(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-5 text-[11px] tracking-[0.22em] uppercase text-slate">
        {renderByline(listing.author_name, listing.sponsor_names)}
      </p>

      {/* A resubmission after a return: the earlier note rides along so the
          reviewer sees what they asked for last time. */}
      {listing.moderation_note && (
        <p className="mt-4 text-sm text-slate">
          <span className="text-[11px] tracking-[0.22em] uppercase">
            Your earlier note:&nbsp;
          </span>
          {listing.moderation_note}
        </p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center max-w-md mx-auto py-10">
      <p className="font-serif text-2xl leading-relaxed text-ink">
        The queue is clear.
      </p>
      <p className="mt-6 text-slate leading-relaxed">
        Nothing in review. New listings land here the moment a member posts
        them.
      </p>
    </div>
  );
}
