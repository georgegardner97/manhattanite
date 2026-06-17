// /profile — the signed-in landing destination.
//
// Server Component: reads the signed-in account row from public.accounts via
// the server Supabase client. If there's no session, redirects to /login.
//
// Phase 4 Slice 2 wires the "Edit profile →" link to /profile/edit.
// The membership-application path (/apply) is still later work.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main className="min-h-screen px-6 py-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          {avatarUrl && (
            <div className="w-24 h-24 rounded-full overflow-hidden bg-ink/[0.06] mx-auto mb-7">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <p className="text-[14px] tracking-[0.22em] uppercase text-slate mb-5">
            {account.is_member ? "Member" : "Account"}
          </p>
          <h1 className="font-serif font-light text-4xl md:text-5xl tracking-tight">
            {account.name ?? account.email}
          </h1>
          <span className="block w-8 h-px bg-ink/30 mx-auto mt-8" />
        </div>

        {/* Profile fields */}
        <dl className="space-y-10 max-w-md mx-auto">
          <Field label="Email" value={account.email} />
          {account.neighborhood && (
            <Field label="Neighborhood" value={account.neighborhood} />
          )}
          {account.bio && <Field label="Bio" value={account.bio} multiline />}
          {account.linkedin_url && (
            <div>
              <dt className="text-[11px] tracking-[0.22em] uppercase text-slate mb-2">
                LinkedIn
              </dt>
              <dd className="font-serif text-lg">
                <a
                  href={externalHref(account.linkedin_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mh-link text-ink break-all"
                >
                  {account.linkedin_url}
                </a>
              </dd>
            </div>
          )}
          <Field
            label="Member since"
            value={new Date(account.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        </dl>

        {/* Connections — the member's trust web, both directions. On-brand:
            trust is the product, so we surface who vouched for whom. Hidden
            entirely when there's nothing to show (or before migration 0024). */}
        {(sponsoredBy.length > 0 || sponsored.length > 0) && (
          <div className="mt-16 border-t border-ink/10 pt-12 max-w-md mx-auto">
            <p className="text-[11px] tracking-[0.22em] uppercase text-slate text-center mb-10">
              Connections
            </p>
            {sponsoredBy.length > 0 && (
              <ConnectionGroup label="Sponsored by" people={sponsoredBy} />
            )}
            {sponsored.length > 0 && (
              <ConnectionGroup label="You've sponsored" people={sponsored} />
            )}
          </div>
        )}

        {/* Member view — the in-product door to the posting form. Without
            this CTA, members have no entry point to /listings/new. */}
        {account.is_member && (
          <div className="mt-20 border-t border-ink/10 pt-12 text-center">
            <Link
              href="/listings/new"
              className="mh-link inline-block text-[14px] tracking-[0.22em] uppercase text-ink"
            >
              Post a listing &rarr;
            </Link>
            {/* Each link wrapped in its own div so the stacking works
                regardless of how mh-link's display property is defined. */}
            <div className="mt-8 space-y-4">
              <div>
                <Link
                  href="/listings"
                  className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink"
                >
                  Browse listings &rarr;
                </Link>
              </div>
              <div>
                <Link
                  href="/profile/edit"
                  className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink"
                >
                  Edit profile &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tier-1 nudge — visible only to account holders, not full members.
            The "Apply for membership" CTA went live in Phase 2 Slice A. */}
        {!account.is_member && (
          <div className="mt-20 border-t border-ink/10 pt-12 text-center">
            <p className="font-serif text-xl leading-relaxed text-ink">
              You have an account. To post a listing, contact a member, or
              sponsor someone, you&apos;ll need to be approved as a member.
            </p>
            <Link
              href="/apply"
              className="mh-link inline-block mt-10 text-[14px] tracking-[0.22em] uppercase text-ink"
            >
              Apply for membership &rarr;
            </Link>
            <div className="mt-8">
              <Link
                href="/profile/edit"
                className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink"
              >
                Edit profile &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="mt-24 text-center">
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="mh-link text-[11px] tracking-[0.22em] uppercase text-slate hover:text-ink cursor-pointer"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function ConnectionGroup({
  label,
  people,
}: {
  label: string;
  people: Connection[];
}) {
  return (
    <div className="mb-10 last:mb-0 text-center">
      <p className="text-[11px] tracking-[0.22em] uppercase text-slate mb-4">
        {label}
      </p>
      <ul className="space-y-2">
        {people.map((p) => (
          <li key={p.account_id} className="font-serif text-lg text-ink">
            {p.name}
            {/* Mark the inviter — the primary sponsor who first brought you in. */}
            {p.direction === "sponsor" && p.is_primary && (
              <span className="ml-3 text-[10px] tracking-[0.22em] uppercase text-slate">
                Inviter
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function externalHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function Field({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] tracking-[0.22em] uppercase text-slate mb-2">
        {label}
      </dt>
      <dd
        className={
          multiline
            ? "font-serif text-lg text-ink leading-relaxed whitespace-pre-wrap"
            : "font-serif text-lg text-ink"
        }
      >
        {value}
      </dd>
    </div>
  );
}
