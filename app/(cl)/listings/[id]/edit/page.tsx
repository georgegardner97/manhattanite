// /listings/[id]/edit — change a listing you posted, in the Classifieds system.
//
// No screen was drawn for this either. It reuses ClPostForm with `initial`, the
// way the editorial route reused NewListingForm — but WITHOUT THE THREE-STEP
// PILLS. The steps exist to stop a blank form feeling like a wall; an edit form
// is not blank, and you came here to change one field, so paging through three
// screens to reach it is friction with nothing on the other side. ClPostForm
// already mounts every field the whole time and only toggles visibility, so
// dropping the steps is a presentation flag rather than a second form.
//
// THE GATES ARE THE LIVE ONES, ALL FIVE, IN ORDER:
//   1. No session                → /login.
//   2. Account, not a member     → the members-only wall.
//   3. Listing not readable      → notFound().
//   4. Member but not the author → the listing itself.
//   5. The author                → the form, pre-filled.
//
// Step 3 is the one that matters and it is why the read is deliberately NOT
// filtered by author_id. listings_read_own (0016) returns the caller's own rows
// at any status and nothing else at any status but published — so someone else's
// pending listing and an id that never existed both fall out of the same
// maybeSingle() as null, and both answer notFound(). Adding `.eq("author_id",
// user.id)` would look tighter and would be the same result; keeping the policy
// as the thing that decides means the page cannot drift from it.
//
// The Slice 4 RLS update policy (author_id = auth.uid() AND is_member()) is the
// real, database-level gate, and updateListing re-checks all of this again.
// These route-level checks are the clean user-facing experience. Every layer
// stays.

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import AppHeader from "@/app/components/cl/AppHeader";
import ClGate from "@/app/components/cl/ClGate";
import ClPostForm, {
  type ClPostFormInitial,
} from "@/app/components/cl/ClPostForm";
import type { ListingStatus } from "@/lib/cl/listings-read";

export const dynamic = "force-dynamic"; // session state varies per request.

type EditableListing = {
  id: string;
  author_id: string;
  type: string;
  title: string;
  description: string;
  price_cents: number | null;
  details: Record<string, unknown>;
  images: { path: string }[];
  status: ListingStatus;
  sponsor_names: string[];
  author_name: string | null;
};

// cents → the string the price input should show (whole dollars stay whole).
// No price comes back as an empty box, so a blank round-trips as a blank rather
// than reappearing as a zero the member never typed.
function formatPriceInput(cents: number | null): string {
  if (cents === null) return "";
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

  if (!user) redirect("/login");

  const { data: account } = await supabase
    .from("accounts")
    .select("name, is_member")
    .eq("id", user.id)
    .maybeSingle<{ name: string | null; is_member: boolean }>();

  if (!account?.is_member) {
    return (
      <>
        <AppHeader active="none" />
        <main className="mx-auto w-full max-w-[1100px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(40px,6vw,80px)] pb-[clamp(32px,4vw,56px)]">
          <ClGate
            title="Members only"
            note="Editing a listing is for members. A member has to vouch for you first."
          />
        </main>
      </>
    );
  }

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, author_id, type, title, description, price_cents, details, images, status, sponsor_names, author_name"
    )
    .eq("id", id)
    .maybeSingle<EditableListing>();

  // Someone else's unpublished listing and a nonexistent one are indistinguishable
  // from here — that is the policy answering, not this page.
  if (!listing) notFound();

  // Someone else's PUBLISHED listing is readable, so this case is real. The page
  // is public anyway, so sending them to it leaks nothing and is friendlier than
  // a 404 for a listing they can plainly see.
  if (listing.author_id !== user.id) {
    redirect(`/listings/${id}`);
  }

  // Sign the current photos so the picker shows real thumbnails. A path that
  // fails to sign still rides along with an empty preview — dropping it from the
  // pre-fill would silently strip the photo from the listing on save.
  const imagePaths = (listing.images ?? [])
    .map((image) => image.path)
    .filter((path): path is string => Boolean(path));
  const urlByPath = await signImagePaths(imagePaths);

  const initial: ClPostFormInitial = {
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
    status: listing.status,
  };

  // Only a live listing has a public page to go back to — pending and draft rows
  // are not readable on /listings/[id], so that link would 404 for its author.
  const isPublished = listing.status === "published";

  return (
    <>
      <AppHeader active="none" />

      <main className="mx-auto w-full max-w-[720px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(26px,3vw,44px)] pb-[clamp(32px,4vw,56px)]">
        <Link
          href={isPublished ? `/listings/${listing.id}` : "/listings/mine"}
          className="cl-quiet mb-5 inline-block text-[13px]"
        >
          {isPublished ? "Back to the listing" : "Back to my listings"}
        </Link>

        <ClPostForm
          userId={user.id}
          authorName={listing.author_name ?? account.name}
          sponsorNames={listing.sponsor_names ?? []}
          initial={initial}
        />
      </main>
    </>
  );
}
