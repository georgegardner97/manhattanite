// /listings/new — post a listing (member-only).
//
// Server Component. This is the write side of the listings wall, so the gate
// is defense in depth:
//   1. No session            → redirect to /login.
//   2. Account, not a member → redirect to /profile (the membership nudge).
//   3. Member                → render the form.
// The Slice 4 RLS write policy is the real, database-level gate; this
// route-level check is the clean user-facing experience (a redirect rather
// than a rejected submit). Both layers stay — never weaken either.
//
// Image upload is wired in Slice 6 (Supabase Storage `listing-images` bucket,
// RLS scoped to the user's own folder).

// Layout (design foundation, Slice 3): the standard light page frame —
// PageShell's label column carries POST A LISTING and the way back, the
// content column carries the statement and the form.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewListingForm from "@/app/components/NewListingForm";
import PageShell from "@/app/components/PageShell";

export const dynamic = "force-dynamic"; // session state varies per request.

export default async function NewListingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Read the member flag. RLS "read own row" allows this without a service
  // role. A null/missing row or a non-member both route to /profile.
  const { data: account } = await supabase
    .from("accounts")
    .select("is_member")
    .eq("id", user.id)
    .single<{ is_member: boolean }>();

  if (!account?.is_member) {
    redirect("/profile");
  }

  return (
    <PageShell
      label="Post a listing"
      title="What have you got?"
      backHref="/listings"
      backLabel="Listings"
    >
      <div className="max-w-[560px] mt-10">
        <NewListingForm userId={user.id} />
      </div>
    </PageShell>
  );
}
