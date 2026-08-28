// /admin/moderation — the listing review queue, in the Classifieds system.
// (Slice 3b.)
//
// THIS IS THE DECISION SURFACE, not the directory. Everything here is waiting
// on you: status='pending', oldest first, shown IN FULL — photos, description,
// every detail key, the byline — because you cannot judge a listing from a row.
// /admin/listings is the other thing: everything that exists, one row deep,
// filterable. The intro line on both screens says which is which, because
// "listings" appearing twice in one nav is otherwise a coin toss.
//
// Reads run as the signed-in admin — 0015's listings_admin_read_all is the data
// gate; image signing rides the admin's own session (the storage read policy
// already serves any authenticated viewer, same as /listings).

import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import ClAdminShell from "@/app/components/cl/ClAdminShell";
import ClModerationActions from "@/app/components/cl/ClModerationActions";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { renderByline } from "@/lib/listings/byline";

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

// One of the two screens that says "No price" out loud instead of rendering
// nothing. A moderator has to be able to tell a deliberate blank from a broken
// row, and silence reads as broken. Everywhere a member or a visitor looks, no
// price still means no line at all (0027).
function formatPrice(cents: number | null, type: PendingListing["type"]): string {
  if (cents === null) return "No price";
  const dollars = Math.round(cents / 100).toLocaleString("en-US");
  return type === "apartment" ? `$${dollars}/mo` : `$${dollars}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
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
    <ClAdminShell
      active="moderation"
      title="What’s waiting to go live"
      intro="Listings a member has submitted, oldest first. Nothing reaches the network without passing through here. Everything that already exists is under All listings."
    >
      {pending.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[19px]">The queue is clear.</p>
          <p
            className="mx-auto mt-2.5 max-w-[42ch] text-[13.5px] leading-[1.6]"
            style={{ color: "var(--cl-muted)" }}
          >
            Nothing in review. New listings land here the moment a member posts
            them.
          </p>
        </div>
      ) : (
        <ul className="max-w-[860px]">
          {pending.map((listing) => (
            <li
              key={listing.id}
              className="border-t py-8 last:border-b"
              style={{ borderColor: "var(--cl-hairline)" }}
            >
              <PendingCard listing={listing} urlByPath={urlByPath} />
              <ClModerationActions listingId={listing.id} />
            </li>
          ))}
        </ul>
      )}
    </ClAdminShell>
  );
}

function PendingCard({
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
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
        <h2 className="text-[19px] tracking-[-0.01em]">{listing.title}</h2>
        <p
          className="whitespace-nowrap text-[15px]"
          style={{
            color: listing.price_cents === null ? "var(--cl-faint)" : "var(--cl-ink)",
          }}
        >
          {formatPrice(listing.price_cents, listing.type)}
        </p>
      </div>

      <p className="cl-grouplabel mt-1.5">
        {humanizeKey(listing.type)} &middot; submitted {formatDate(listing.created_at)}
      </p>

      {imageUrls.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2.5 max-[560px]:grid-cols-2">
          {imageUrls.map((url) => (
            <div key={url} className="cl-media" style={{ height: "clamp(110px,12vw,150px)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" />
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 max-w-[62ch] text-[14px] leading-[1.65] whitespace-pre-wrap">
        {listing.description}
      </p>

      {detailEntries.length > 0 && (
        <dl className="mt-4 flex flex-col gap-1.5">
          {detailEntries.map(([key, value]) => (
            <div key={key} className="flex flex-wrap gap-2.5 text-[13px]">
              <dt className="cl-grouplabel">{humanizeKey(key)}</dt>
              <dd>{formatDetailValue(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="cl-grouplabel mt-4">
        {renderByline(listing.author_name, listing.sponsor_names)}
      </p>

      {/* A resubmission after a return: the earlier note rides along so the
          reviewer sees what they asked for last time. */}
      {listing.moderation_note && (
        <p className="mt-3 text-[13px]" style={{ color: "var(--cl-muted)" }}>
          <span className="cl-grouplabel">Your earlier note:</span>{" "}
          {listing.moderation_note}
        </p>
      )}

      <p className="mt-3 text-[12.5px]">
        <Link href={`/admin/listings/${listing.id}/edit`} className="cl-quiet">
          Correct it instead
        </Link>
      </p>
    </div>
  );
}
