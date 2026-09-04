// /invite — a member brings someone in, in the Classifieds system.
//
// Server Component: re-checks session and membership the way every member-only
// page here does, then renders the client form. RLS (invites_insert_own, 0020)
// is the real gate; these redirects are ergonomics.
//
// STILL NO IN-PRODUCT ENTRY POINT, and that is the thing to know about this
// screen. Nothing in the Classifieds system links here yet: the header has four
// destinations and none of them is this, and the contact gate offers "Apply for
// membership" alone. Migrating it does not launch the growth loop — it means
// the loop is ready when a link is added, rather than the link arriving and
// landing on a retired design system.
//
// THE PRODUCT SCREEN GRAMMAR, NOT THE THRESHOLD CARD. /join and
// /sponsor-request are read by strangers arriving from an email and get the
// centered card; this one is read by a member who is already inside, so it is
// shaped like /listings/new — header, heading, form.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/cl/AppHeader";
import ClInviteForm from "@/app/components/cl/ClInviteForm";

export const dynamic = "force-dynamic"; // session state varies per request.

export default async function ClassifiedsInvitePage() {
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

  return (
    <>
      <AppHeader active="none" />

      <main className="mx-auto w-full max-w-[560px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(26px,3vw,44px)] pb-[clamp(32px,4vw,56px)]">
        <h1 className="text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.02em]">
          Bring someone in.
        </h1>
        {/* REWRITTEN 2026-09-04 for the invitation-only direction, then again
            the same day once the rule behind it existed. George settled the
            shared-liability question that afternoon: if someone breaks the
            terms, they and the members who vouched for them are assessed the
            same way. That is now written into /terms, which is why this copy
            is allowed to say it — earlier in the day it deliberately stopped
            short, because three separate pieces of copy this week were found
            promising mechanisms that had never been built. The wording is
            ASSESSED, not removed: the rule is that a voucher's judgment gets
            looked at, not that they are automatically expelled. Do not
            sharpen it into an automatic consequence without changing the
            Terms first. */}
        <p
          className="mt-3 max-w-[52ch] text-[13.5px] leading-[1.6]"
          style={{ color: "var(--cl-muted)" }}
        >
          There is no other way in. Invite someone you&rsquo;d vouch for out
          loud &mdash; your name stays beside theirs for as long as they&rsquo;re
          here, and if they break the terms, your own membership is looked at
          the same way.
        </p>

        <div className="mt-8">
          <ClInviteForm />
        </div>
      </main>
    </>
  );
}
