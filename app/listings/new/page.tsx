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

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewListingForm from "@/app/components/NewListingForm";

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
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-2xl mx-auto">
        {/* Wordmark */}
        <div className="text-center mb-20">
          <Link
            href="/"
            className="font-serif font-extralight text-4xl md:text-5xl tracking-tighter leading-none text-ink"
          >
            Manhattan<span className="italic">ite</span>
          </Link>
        </div>

        <Link
          href="/listings"
          className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink"
        >
          &larr; Listings
        </Link>

        <div className="text-center mt-12 mb-16">
          <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
            Post a listing
          </p>
          <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight text-ink">
            What have you got?
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
        </div>

        <NewListingForm userId={user.id} />
      </div>
    </main>
  );
}
