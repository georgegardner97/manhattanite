// Server action for submitting a membership application — Phase 2 Slice A.
//
// Rewritten from the dormant waitlist version. The old code collected name +
// email from an anonymous visitor and wrote to Airtable + Resend. The new model
// is account-bound: the applicant is already a signed-in Tier 1 account, so:
//   - email comes from the session, never typed;
//   - name + neighborhood are written back to the accounts row (so the byline
//     name gets set as a side effect of applying — closes the Slice 2 "name not
//     collected" gap for real members);
//   - occupation, the paragraph, and the sponsor reference live only on the
//     new applications row.
//
// Airtable is gone (Supabase is the source of truth). Resend stays as a
// best-effort heads-up to the reviewer (info@manhattanite.com). The applicant's
// own confirmation email is Slice C; this slice only shows them the on-page
// confirmation state (rendered by app/apply/page.tsx when a pending row exists).
//
// Returns a { error } state for inline display via useActionState in the client
// form. On a clean insert it redirect()s to /apply, where the pending-row guard
// renders the confirmation copy instead of the form.

"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export type SubmitApplicationState = { error: string | null };

// Postgres error codes we care about.
const RLS_VIOLATION = "42501"; // is_member() gate fired (already a member)
const UNIQUE_VIOLATION = "23505"; // a pending application already exists

const MAX_NAME = 80;
const MAX_NEIGHBORHOOD = 60;
const MAX_OCCUPATION = 120;
const MAX_ABOUT = 1500;
const MAX_SPONSOR_REF = 200;

// Pull a string from FormData, trim, and treat empty as null.
function pluck(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function submitApplication(
  _prevState: SubmitApplicationState,
  formData: FormData
): Promise<SubmitApplicationState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ---- Pluck + validate ----
  const name = pluck(formData, "name");
  const neighborhood = pluck(formData, "neighborhood");
  const occupation = pluck(formData, "occupation");
  const about = pluck(formData, "about");
  const sponsorReference = pluck(formData, "sponsor_reference");

  // Name is required at apply time — you're vouching for a real person, and the
  // byline convention (decisions.md, 2026-06-04) wants a real name. They can
  // still edit or clear it later on /profile/edit.
  if (!name) {
    return { error: "Tell us your name — first and last." };
  }
  if (name.length < 2) {
    return { error: "Add a few more letters to your name." };
  }
  if (name.length > MAX_NAME) {
    return { error: `Keep your name to ${MAX_NAME} characters or fewer.` };
  }
  if (!neighborhood) {
    return { error: "Let us know where in Manhattan you live." };
  }
  if (neighborhood.length > MAX_NEIGHBORHOOD) {
    return {
      error: `Neighborhood should be ${MAX_NEIGHBORHOOD} characters or fewer.`,
    };
  }
  if (!occupation) {
    return { error: "Tell us what you do." };
  }
  if (occupation.length > MAX_OCCUPATION) {
    return {
      error: `Keep that to ${MAX_OCCUPATION} characters or fewer.`,
    };
  }
  if (!about) {
    return { error: "Tell us a little about yourself, in your own words." };
  }
  if (about.length > MAX_ABOUT) {
    return {
      error: `That's a little long — keep it under ${MAX_ABOUT} characters.`,
    };
  }
  if (sponsorReference && sponsorReference.length > MAX_SPONSOR_REF) {
    return {
      error: `Keep the referral to ${MAX_SPONSOR_REF} characters or fewer.`,
    };
  }

  // ---- 1. Write name + neighborhood back to the accounts row. ----
  // RLS "accounts: update own row" allows this; the protect_account_columns
  // trigger (0001) ignores name/neighborhood (they're not protected columns).
  // This is the byline-name side effect — applying sets the member's real name.
  const { error: profileError } = await supabase
    .from("accounts")
    .update({ name, neighborhood })
    .eq("id", user.id);

  if (profileError) {
    console.error("Failed to update account during apply:", profileError);
    return {
      error: "Something went wrong sending your application. Try again in a moment.",
    };
  }

  // ---- 2. Insert the application row. RLS is the real gate. ----
  const { error: insertError } = await supabase.from("applications").insert({
    account_id: user.id,
    occupation,
    about,
    sponsor_reference: sponsorReference,
    neighborhood,
    // status defaults to 'pending' in the schema.
  });

  if (insertError) {
    // Already have a pending application — defensive; the route guards this too.
    if (insertError.code === UNIQUE_VIOLATION) {
      return {
        error: "You've already applied — we're reading it. Hang tight.",
      };
    }
    // is_member() gate fired (somehow already a member): send them to /profile.
    if (insertError.code === RLS_VIOLATION) {
      redirect("/profile");
    }
    console.error("Failed to insert application:", insertError);
    return {
      error: "Something went wrong sending your application. Try again in a moment.",
    };
  }

  // ---- 3. Reviewer heads-up via Resend (best-effort). ----
  // Own try/catch so a mail failure never loses the application — the row is
  // already safely written above.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Manhattanite <applications@manhattanite.com>",
      to: "info@manhattanite.com",
      subject: `New Manhattanite application: ${name}`,
      html: `
        <h2>New Manhattanite application</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${user.email ?? "—"}</p>
        <p><strong>Neighborhood:</strong> ${neighborhood}</p>
        <p><strong>Occupation:</strong> ${occupation}</p>
        <p><strong>About:</strong><br />${about.replace(/\n/g, "<br />")}</p>
        <p><strong>Referred by:</strong> ${sponsorReference ?? "—"}</p>
      `,
    });
  } catch (error) {
    console.error("Reviewer notification email failed (application saved):", error);
  }

  // Success — a pending row now exists, so /apply renders the confirmation state.
  redirect("/apply");
}
