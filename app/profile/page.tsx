// /profile — the signed-in landing destination.
//
// Server Component: reads the signed-in account row from public.accounts via
// the server Supabase client. If there's no session, redirects to /login.
//
// Phase 4 Slice 2 wires the "Edit profile →" link to /profile/edit.
// The membership-application path (/apply) is still later work.

// Layout (design foundation, Slice 3): the audit graded this page C+ — a
// centered stack of fields with no hierarchy. It now uses the standard light
// frame: label column carries the TIER and the avatar, content column carries
// the name as the statement and the fields as the same hairline label/value
// rows the listing detail uses. No new data — the connections rpc below was
// already here.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageShell from "@/app/components/PageShell";
import MetaRows, { type MetaRow } from "@/app/components/MetaRows";
import BoxButton from "@/app/components/BoxButton";
import ArrowLink from "@/app/components/ArrowLink";

export const dynamic = "force-dynamic"; // session state varies per request.

type AccountRow = {
  id: string;
  email: string;
  name: string | null;
  neighborhood: string | null;
  bio: string | null;
  avatar_path: string | null;
  linkedin_url: string | null;
  role: "account" | "member" | "admin";
  is_member: boolean;
  sponsor_id: string | null;
  created_at: string;
};

// One side of the member's trust web, from get_my_connections() (migration 0024).
//   sponsor  — this person sponsors me ("Sponsored by")
//   sponsee  — I sponsor this person ("You've sponsored")
type Connection = {
  direction: "sponsor" | "sponsee";
  account_id: string;
  name: string;
  is_primary: boolean;
};

export default async function ProfilePage() {
  const supabase = await createClient();

  // getUser() validates the session against Supabase Auth on every call —
  // safer than getSession() which trusts whatever is in the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS policy "accounts: read own row" allows this; no service role needed.
  const { data: account, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", user.id)
    .single<AccountRow>();

  // If the trigger somehow didn't fire (race condition during signup), show
  // a graceful state instead of crashing. Shouldn't happen in practice.
  if (error || !account) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <p className="font-serif text-lg text-slate">
          Setting up your account…
        </p>
        <p className="mt-4 text-sm text-slate">
          Refresh in a moment. If this persists, email{" "}
          <a href="mailto:info@manhattanite.com" className="mh-link text-ink">
            info@manhattanite.com
          </a>
          .
        </p>
      </main>
    );
  }

  // Public bucket → a plain URL, no signing.
  const avatarUrl = account.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(account.avatar_path).data
        .publicUrl
    : null;

  // The member's sponsorship web, scoped to themselves by the SECURITY DEFINER
  // function (auth.uid()). Fails soft: if the migration isn't applied yet, the
  // rpc errors and we simply render no connections section — nothing breaks.
  const { data: connectionsData } = await supabase.rpc("get_my_connections");
  const connections = (connectionsData ?? []) as Connection[];
  const sponsoredBy = connections.filter((c) => c.direction === "sponsor");
  const sponsored = connections.filter((c) => c.direction === "sponsee");

  // The fields, as label/value rows. Optional ones drop out entirely rather
  // than rendering empty — a row reading "Bio —" is worse than no row.
  const rows: MetaRow[] = [{ label: "Email", value: account.email }];
  if (account.neighborhood) {
    rows.push({ label: "Neighborhood", value: account.neighborhood });
  }
  if (account.bio) {
    rows.push({
      label: "Bio",
      value: (
        <span className="block leading-relaxed whitespace-pre-wrap">
          {account.bio}
        </span>
      ),
    });
  }
  if (account.linkedin_url) {
    rows.push({
      label: "LinkedIn",
      value: (
        <a
          href={externalHref(account.linkedin_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="mh-link text-ink break-all"
        >
          {account.linkedin_url}
        </a>
      ),
    });
  }
  rows.push({
    label: account.is_member ? "Member since" : "Account since",
    value: new Date(account.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  return (
    <PageShell
      label={account.is_member ? "Member" : "Account"}
      title={account.name ?? account.email}
      aside={
        avatarUrl ? (
          <div className="mt-5 w-[84px] h-[84px] rounded-full overflow-hidden bg-ink/[0.06]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : null
      }
    >
      {/* omitFirstRule: the title above already closes with a hairline. */}
      <MetaRows className="max-w-[560px]" rows={rows} omitFirstRule />

      {/* Connections — the member's trust web, both directions. On-brand:
          trust is the product, so we surface who vouched for whom. Hidden
          entirely when there's nothing to show (or before migration 0024).
          Small caps, one line per direction — this is a credential, not a
          section, and it shouldn't outweigh the fields above it. */}
      {sponsoredBy.length > 0 && (
        <p className="mh-label mt-8 text-slate">
          Sponsored by {renderNames(sponsoredBy)}
        </p>
      )}
      {sponsored.length > 0 && (
        <p className="mh-label mt-2.5 text-slate">
          You&rsquo;ve sponsored {renderNames(sponsored)}
        </p>
      )}

      {/* Tier-1 nudge — account holders only, not full members. */}
      {!account.is_member && (
        <p className="font-serif text-[26px] leading-[1.25] max-w-[30ch] mt-12 text-ink">
          You have an account. To post a listing, contact a member, or sponsor
          someone, you&rsquo;ll need to be approved as a member.
        </p>
      )}

      {/* One boxed primary per screen. For a member that's editing the
          profile they're looking at; for Tier-1 it's the conversion. */}
      <div className="mt-10">
        {account.is_member ? (
          <BoxButton href="/profile/edit" surface="light">
            Edit profile
          </BoxButton>
        ) : (
          <BoxButton href="/apply" surface="light">
            Apply for membership
          </BoxButton>
        )}
      </div>

      {/* Everything else that moves you forward is an ArrowLink. */}
      <div className="mt-8 flex flex-col items-start gap-3">
        {account.is_member ? (
          <>
            <ArrowLink href="/listings/new">Post a listing</ArrowLink>
            <ArrowLink href="/listings/mine">My listings</ArrowLink>
            <ArrowLink href="/listings">Browse listings</ArrowLink>
          </>
        ) : (
          <>
            <ArrowLink href="/profile/edit">Edit profile</ArrowLink>
            <ArrowLink href="/listings">Browse listings</ArrowLink>
          </>
        )}
      </div>

      {/* Sign out — deliberately the quietest thing on the page. */}
      <form action="/auth/sign-out" method="post" className="mt-14">
        <button
          type="submit"
          className="mh-label text-slate hover:text-ink cursor-pointer transition-colors"
        >
          Sign out
        </button>
      </form>
    </PageShell>
  );
}

// "Anna", "Anna & Ben", "Anna, Ben + 2 more" — the same hybrid-at-2 shape the
// listing byline uses, so a name list reads identically wherever it appears.
// The inviter (primary sponsor) is rendered first.
function renderNames(people: Connection[]): string {
  const ordered = [...people].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary)
  );
  const names = ordered.map((p) => p.name);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]}, ${names[1]} + ${names.length - 2} more`;
}

function externalHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
