// TEMPORARY smoke-test page for Phase 1 Slice 1.
//
// Visit /supabase-test on a deployed environment (or locally with `npm run dev`)
// to confirm that:
//   1. The Supabase environment variables are wired up.
//   2. The server-side Supabase client can be constructed.
//   3. A simple unauthenticated call to Supabase succeeds.
//
// Delete this route once auth is wired in slice 2 — by then we'll have real
// pages exercising the same path.

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // never cache; we want fresh checks.

export default async function SupabaseTestPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(missing)";
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let connectionResult: string;
  let errorMessage: string | null = null;

  try {
    const supabase = await createClient();
    // getUser() against an unauthenticated request returns { user: null }
    // without erroring — proves the client can talk to Supabase Auth.
    const { data, error } = await supabase.auth.getUser();

    if (error && error.message !== "Auth session missing!") {
      // "Auth session missing!" is the expected, fine response for an
      // anonymous visitor. Anything else is a real error.
      throw error;
    }

    connectionResult = data.user
      ? `Authenticated as ${data.user.email}`
      : "Connected (no active session — expected for anonymous visitors)";
  } catch (err) {
    connectionResult = "Failed";
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  return (
    <main
      style={{
        maxWidth: "640px",
        margin: "4rem auto",
        padding: "0 1.5rem",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        lineHeight: "1.6",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
        Supabase smoke test
      </h1>

      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1.5rem" }}>
        <dt>URL set</dt>
        <dd>{url}</dd>

        <dt>Anon key set</dt>
        <dd>{hasAnonKey ? "yes" : "no"}</dd>

        <dt>Connection</dt>
        <dd>{connectionResult}</dd>

        {errorMessage && (
          <>
            <dt>Error</dt>
            <dd style={{ color: "#b91c1c" }}>{errorMessage}</dd>
          </>
        )}
      </dl>

      <p style={{ marginTop: "2rem", fontSize: "0.875rem", opacity: 0.6 }}>
        Delete this route (app/supabase-test/) once slice 2 ships real auth pages.
      </p>
    </main>
  );
}
