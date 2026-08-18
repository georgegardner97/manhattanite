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

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileEditForm from "@/app/components/ProfileEditForm";
import PageShell from "@/app/components/PageShell";

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
    <PageShell
      label="Edit profile"
      title="Who are you?"
      backHref="/profile"
      backLabel="Profile"
    >
      <div className="max-w-[560px] mt-10">
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
    </PageShell>
  );
}
