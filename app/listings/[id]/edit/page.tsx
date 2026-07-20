// /listings/[id]/edit — edit a listing (member-only, owner-only).
//
// Server Component. Gating mirrors /listings/new, with one extra step:
//   1. No session             → redirect to /login.
//   2. Account, not a member  → redirect to /profile (the membership nudge).
//   3. Listing not readable   → notFound(). (The owner reads their own rows at
//      any status via listings_read_own; anyone else only sees published rows,
//      so someone else's pending/draft id and a nonexistent id both land here.)
//   4. Member but not the author → redirect to the listing itself. The page
//      is publicly viewable anyway, so this leaks nothing — it's just the
//      friendlier landing than a 404.
//   5. The author             → render the form pre-filled.
// The Slice 4 RLS update policy is the real, database-level gate; this
// route-level check is the clean user-facing experience. Both layers stay.

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import PageShell from "@/app/components/PageShell";
import NewListingForm, {
  type ListingFormInitial,
} from "@/app/components/NewListingForm";

export const dynamic = "force-dynamic"; // session state varies per request.

type ListingRow = {
  id: string;
  author_id: string;
  type: "apartment" | "furniture" | "other" | "service";
  title: string;
  description: string;
  price_cents: number;
  details: Record<string, unknown>;
  images: { path: string }[];
  status: string;
};

// cents → the string the price input should show (whole dollars stay whole).
function formatPriceInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("is_member")
    .eq("id", user.id)
    .single<{ is_member: boolean }>();

  if (!account?.is_member) {
    redirect("/profile");
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, author_id, type, title, description, price_cents, details, images, status")
    .eq("id", id)
    .maybeSingle<ListingRow>();

  if (!listing) {
    notFound();
  }

  if (listing.author_id !== user.id) {
    redirect(`/listings/${id}`);
  }

  // Sign the current images so the uploader shows real thumbnails. A path
  // that fails to sign still rides along (empty preview) — removing it from
  // the pre-fill would silently strip it from the listing on save.
  const imagePaths = (listing.images ?? [])
    .map((i) => i.path)
    .filter((p): p is string => Boolean(p));
  const urlByPath = await signImagePaths(imagePaths);

  const initial: ListingFormInitial = {
    id: listing.id,
    type: listing.type,
    title: listing.title,
    description: listing.description,
    price: formatPriceInput(listing.price_cents),
    details: listing.details ?? {},
    images: imagePaths.map((path) => ({
      path,
      previewUrl: urlByPath.get(path) ?? "",
    })),
  };

  // Only a live listing has a public page to go back to — pending and draft
  // rows would 404 on /listings/[id] (published-only read).
  const isPublished = listing.status === "published";

  return (
    <PageShell
      label="Edit listing"
      title="Touch it up."
      backHref={isPublished ? `/listings/${listing.id}` : "/listings/mine"}
      backLabel={isPublished ? "The listing" : "My listings"}
    >
      <div className="max-w-[560px] mt-10">
        <NewListingForm userId={user.id} initial={initial} />
      </div>
    </PageShell>
  );
}
