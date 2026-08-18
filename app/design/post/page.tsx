// Screen 05 — Post a listing, in the Classifieds system.
//
// Member-gated exactly as the live /listings/new is: no session → the access
// screen, an account that isn't a member → the members-only wall. Posting is
// the sharpest edge of the Tier 1 / Tier 2 line, so the gate is restated here
// in full rather than assumed from the UI that linked you in.

import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/cl/AppHeader";
import ClGate from "@/app/components/cl/ClGate";
import ClPostForm from "@/app/components/cl/ClPostForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // session state varies per request.

export default async function ClassifiedsPostPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Read-own: this is the viewer's own row and nobody else's.
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
            title="Members post"
            note="Posting is for members. A member has to vouch for you first."
          />
        </main>
      </>
    );
  }

  // The byline the review step previews. sponsor_names is denormalized onto
  // listings, not accounts, so the poster's own sponsors are read from their
  // most recent listing if they have one — and simply omitted if they don't,
  // rather than guessed at.
  const { data: previous } = await supabase
    .from("listings")
    .select("sponsor_names")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ sponsor_names: string[] }>();

  return (
    <>
      <AppHeader active="none" />
      <main className="mx-auto w-full max-w-[720px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(26px,3vw,44px)] pb-[clamp(32px,4vw,56px)]">
        <ClPostForm
          userId={user.id}
          authorName={account.name}
          sponsorNames={previous?.sponsor_names ?? []}
        />
      </main>
    </>
  );
}
