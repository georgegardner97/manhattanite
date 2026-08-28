// Server actions for the listing moderation queue — Listing Moderation slice.
//
// Each action re-checks that the caller is a signed-in ADMIN, then calls the
// matching SECURITY DEFINER moderation function over the caller's own session —
// NOT the service role. Defense in depth, three layers (same as review.ts):
//   1. The /admin route gate (requireAdmin) — clean UX.
//   2. This action-level role check — clean errors.
//   3. The in-function admin guard + grants (migration 0017) — the real wall.
// Never swap these rpc calls to a service-role client: that would make layer 2
// the only real check, and the trust layer doesn't lean on app code.
//
// Each outcome also emails the lister (best-effort, in its own try/catch —
// the review already happened; a failed email must never look like a failed
// review). The lister lookup is TWO separate queries (listing by id, then
// accounts by author_id) — deliberately NOT a PostgREST FK embed; an embed on
// this relationship is what broke the member directory (2026-06-11 fix).

"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  sendListingApproved,
  sendListingReturned,
  sendListingRejected,
} from "@/lib/applications/emails";

export type ModerateActionState = { error: string | null };

// Map the Postgres raise/permission errors to copy a human can act on.
function readableError(message: string): string {
  if (/permission denied/i.test(message)) {
    return "The moderation functions aren't enabled yet — run migration 0017 first.";
  }
  if (/not authorized/i.test(message)) {
    return "Your account isn't authorized to review listings.";
  }
  if (/not found or not pending/i.test(message)) {
    return "This listing was already reviewed (or no longer exists). Refresh the queue.";
  }
  console.error("Unmapped moderation error:", message);
  return "Something went wrong reviewing this listing. Try again in a moment.";
}

// Shared preamble: session + admin re-check, returns the listing id.
async function adminAndId(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (account?.role !== "admin") {
    return { supabase, id: null as string | null };
  }

  const id = String(formData.get("id") ?? "").trim();
  return { supabase, id: id || null };
}

function refreshQueue(): void {
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/listings");
  revalidatePath("/listings/mine");
  // THE GUEST TEASER IS A CACHE ENTRY, NOT A ROUTE RENDER. It is held by
  // unstable_cache inside readPermittedListings, so revalidatePath above does
  // not touch it — approving a listing would leave logged-out visitors looking
  // at the old six for up to 60 seconds. Approval is exactly the moment the
  // public feed changes, so the tag is dropped here.
  updateTag("listings");
}

// The lister behind a listing, for the outcome email. Two separate queries —
// see the header note on why this must never become an FK embed. Runs as the
// signed-in admin: 0015's listings_admin_read_all + 0002's accounts read-all
// are the data gates. Returns null if either read comes up empty; the caller
// just skips the email.
async function listerFor(
  supabase: SupabaseClient,
  listingId: string
): Promise<{ email: string; name: string | null; title: string } | null> {
  const { data: listing } = await supabase
    .from("listings")
    .select("author_id, title")
    .eq("id", listingId)
    .maybeSingle<{ author_id: string; title: string }>();
  if (!listing) return null;

  const { data: author } = await supabase
    .from("accounts")
    .select("email, name")
    .eq("id", listing.author_id)
    .maybeSingle<{ email: string; name: string | null }>();
  if (!author?.email) return null;

  return { email: author.email, name: author.name, title: listing.title };
}

export async function approveListing(
  _prevState: ModerateActionState,
  formData: FormData
): Promise<ModerateActionState> {
  const { supabase, id } = await adminAndId(formData);
  if (!id) {
    return { error: "Your account isn't authorized to review listings." };
  }

  const { error } = await supabase.rpc("approve_listing", {
    p_listing_id: id,
  });

  if (error) {
    return { error: readableError(error.message) };
  }

  // "Your listing is live" — best-effort, after the approval is already done.
  try {
    const lister = await listerFor(supabase, id);
    if (lister) {
      await sendListingApproved({
        to: lister.email,
        listerName: lister.name,
        listingTitle: lister.title,
        listingId: id,
      });
    }
  } catch (emailError) {
    console.error("Approval email failed after approve_listing:", emailError);
  }

  refreshQueue();
  return { error: null };
}

export async function returnListing(
  _prevState: ModerateActionState,
  formData: FormData
): Promise<ModerateActionState> {
  const { supabase, id } = await adminAndId(formData);
  if (!id) {
    return { error: "Your account isn't authorized to review listings." };
  }

  // The note is the whole point of a return — the member needs to know what
  // to fix before they resubmit.
  const note = String(formData.get("note") ?? "").trim();
  if (!note) {
    return { error: "Tell them what needs changing — the note travels with the listing." };
  }

  const { error } = await supabase.rpc("return_listing", {
    p_listing_id: id,
    p_note: note,
  });

  if (error) {
    return { error: readableError(error.message) };
  }

  // "A note on your listing" — carries the feedback; best-effort.
  try {
    const lister = await listerFor(supabase, id);
    if (lister) {
      await sendListingReturned({
        to: lister.email,
        listerName: lister.name,
        listingTitle: lister.title,
        note,
      });
    }
  } catch (emailError) {
    console.error("Return email failed after return_listing:", emailError);
  }

  refreshQueue();
  return { error: null };
}

export async function rejectListing(
  _prevState: ModerateActionState,
  formData: FormData
): Promise<ModerateActionState> {
  const { supabase, id } = await adminAndId(formData);
  if (!id) {
    return { error: "Your account isn't authorized to review listings." };
  }

  // A reason is required here too — it's the record of why it came down.
  const note = String(formData.get("note") ?? "").trim();
  if (!note) {
    return { error: "Give the reason — it stays on the record with the listing." };
  }

  const { error } = await supabase.rpc("reject_listing", {
    p_listing_id: id,
    p_note: note,
  });

  if (error) {
    return { error: readableError(error.message) };
  }

  // "About your listing" — carries the reason, kept gracious; best-effort.
  try {
    const lister = await listerFor(supabase, id);
    if (lister) {
      await sendListingRejected({
        to: lister.email,
        listerName: lister.name,
        listingTitle: lister.title,
        note,
      });
    }
  } catch (emailError) {
    console.error("Rejection email failed after reject_listing:", emailError);
  }

  refreshQueue();
  return { error: null };
}
