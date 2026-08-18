// /invite — a member brings someone in. Member-gated (Invite slice, Stage 1).
//
// Server Component: re-checks session + membership the same way the other
// member-only pages do, then renders the client InviteForm. RLS
// (invites_insert_own, migration 0020) is the real gate; this redirect is UX.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InviteForm from "@/app/components/InviteForm";

export const dynamic = "force-dynamic"; // session state varies per request.

export default async function InvitePage() {
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
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-14">
          <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
            Invite
          </p>
          <h1 className="font-serif font-light text-3xl md:text-4xl tracking-tight text-ink">
            Bring someone in.
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
          <p className="font-serif text-lg text-slate leading-relaxed mt-10">
            Invite someone you&rsquo;d vouch for. They join through you &mdash;
            and you&rsquo;re named as their sponsor on the network. We still read
            every new member by hand.
          </p>
        </div>

        <InviteForm />
      </div>
    </main>
  );
}
