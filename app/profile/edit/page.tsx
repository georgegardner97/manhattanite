// /profile/edit — edit your own profile (name, neighborhood, bio).
// Phase 4 Slice 2 — profile editing
//
// Server Component. Auth-gated:
//   1. No session → redirect to /login.
//   2. Authenticated → fetch the user's own accounts row via RLS read-own,
//      pass current values to the client form as defaults.
//
// Protected columns (role, is_member, sponsor_id, email) are never exposed
// on this form — the protect_account_columns trigger from 0001 would reject
// any attempt to change them, but the cleanest defense is to not even ask.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileEditForm from "@/app/components/ProfileEditForm";

export const dynamic = "force-dynamic"; // session state varies per request.

type EditableAccount = {
  name: string | null;
  neighborhood: string | null;
  bio: string | null;
  avatar_path: string | null;
  linkedin_url: string | null;
};

export default async function ProfileEditPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS "accounts: read own row" allows this without a service role.
  const { data: account } = await supabase
    .from("accounts")
    .select("name, neighborhood, bio, avatar_path, linkedin_url")
    .eq("id", user.id)
    .single<EditableAccount>();

  // Public bucket → a plain URL, no signing.
  const avatarUrl = account?.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(account.avatar_path).data
        .publicUrl
    : null;

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/profile"
          className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink"
        >
          &larr; Profile
        </Link>

        <div className="text-center mt-12 mb-16">
          <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
            Edit profile
          </p>
          <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight text-ink">
            Who are you?
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
        </div>

        <ProfileEditForm
          userId={user.id}
          initialName={account?.name ?? null}
          initialNeighborhood={account?.neighborhood ?? null}
          initialBio={account?.bio ?? null}
          initialAvatarPath={account?.avatar_path ?? null}
          initialAvatarUrl={avatarUrl}
          initialLinkedin={account?.linkedin_url ?? null}
        />
      </div>
    </main>
  );
}
