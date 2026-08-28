// /admin/listings/[id]/edit — an admin corrects any listing. NEW in Slice 3b.
//
// THE SCOPE IS CORRECTION, NOT REWRITING (George, 28 Aug): spelling, a factual
// error, a cover photo that should not be the cover. Never a rewrite of what a
// member said under their own name. Three things hold that line:
//
//   1. The write set is IDENTICAL to the member edit path, because it is the
//      same form. An admin cannot reach a field a member could not have set.
//   2. The byline is untouchable — author_id, author_name and sponsor_names are
//      not in the write set and admin_update_listing does not write them.
//   3. Every save stamps corrected_by / corrected_at, and the owner sees
//      "Corrected by Manhattanite" on their own listing. An invisible rewrite of
//      what somebody wrote under their own name is the wrong default even when
//      the intent is a spelling fix.
//
// IT REUSES ClPostForm, AND THAT IS LOAD-BEARING. `details` is rebuilt WHOLESALE
// from the posted fields on every save, so a trimmed-down admin editor would
// silently delete bedrooms, condition, dimensions and brand from any listing an
// admin touched — the exact shape of the bug that wiped neighborhoods off
// furniture listings on 27 Aug. Every field stays mounted; nothing is dropped.
//
// A CORRECTION MUST NOT RE-PEND THE LISTING. admin_update_listing never writes
// `status`, and the 0017 trigger exempts a signed-in admin from the transition
// rules entirely, so a live listing stays live. Pulling a listing off the site
// so George could approve his own typo fix would be a worse bug than the typo.
//
// GATES: requireAdmin (no session → /login, non-admin → notFound, so the admin
// surface does not exist for anyone else); listings_admin_read_all (0015) is the
// data gate; admin_update_listing carries the admin check again in the database.

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/guard";
import ClAdminShell from "@/app/components/cl/ClAdminShell";
import ClPostForm, {
  type ClPostFormInitial,
} from "@/app/components/cl/ClPostForm";
import { signImagePaths } from "@/lib/storage/sign-image-urls";

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
  status: "draft" | "pending" | "published" | "archived";
  author_name: string | null;
  sponsor_names: string[];
};

const STATUS_LABEL: Record<string, string> = {
  draft: "returned to the member",
  pending: "in review",
  published: "live",
  archived: "archived",
};

/** Whole dollars, the way the price input shows them. Blank stays blank. */
function formatPriceInput(cents: number | null): string {
  if (cents === null) return "";
  return String(Math.round(cents / 100));
}

export default async function AdminEditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase, user } = await requireAdmin();
  const { id } = await params; // Next 16: params is async.

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, author_id, type, title, description, price_cents, details, images, status, author_name, sponsor_names"
    )
    .eq("id", id)
    .maybeSingle<EditableListing>();

  if (!listing) notFound();

  // Sign the current photos so the picker shows real thumbnails. A path that
  // fails to sign still rides along with an empty preview — dropping it from
  // the pre-fill would silently strip the photo from the listing on save.
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

  return (
    <ClAdminShell
      active="listings"
      title="Correct a listing"
      intro={`This listing is ${STATUS_LABEL[listing.status] ?? listing.status}, and saving a correction leaves it that way. Fix what is wrong — spelling, a factual error, a cover photo that should not be the cover. It is not the place to rewrite what a member said; they will see that it was corrected.`}
    >
      <Link href="/admin/listings" className="cl-quiet mb-5 inline-block text-[13px]">
        Back to all listings
      </Link>

      {/* userId is the ADMIN, because ClImageUpload writes into the signed-in
          user's own Storage folder and the Storage policy allows nothing else.
          Existing photos keep the owner's paths; adminUpdateListing accepts
          both folders. Passing the owner's id here would make every upload
          fail the Storage policy. */}
      <ClPostForm
        mode="admin"
        userId={user.id}
        authorName={listing.author_name}
        sponsorNames={listing.sponsor_names ?? []}
        initial={initial}
      />
    </ClAdminShell>
  );
}
