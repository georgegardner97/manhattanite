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
  role: "account" | "member" | "admin";
  is_member: boolean;
  sponsor_id: string | null;
  created_at: string;
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

        {/* Header */}
        <div className="text-center mb-16">
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
          <Field
            label="Member since"
            value={new Date(account.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        </dl>

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
            The "Apply for membership" CTA is commented out until /apply
            ships in a later slice. The nudge text stands on its own for now. */}
        {!account.is_member && (
          <div className="mt-20 border-t border-ink/10 pt-12 text-center">
            <p className="font-serif text-xl leading-relaxed text-ink">
              You have an account. To post a listing, contact a member, or
              sponsor someone, you&apos;ll need to be approved as a member.
            </p>
            {/* <Link
              href="/apply"
              className="mh-link inline-block mt-10 text-[14px] tracking-[0.22em] uppercase text-ink"
            >
              Apply for membership
            </Link> */}
            <div className="mt-10">
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
