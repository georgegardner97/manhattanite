// Server action for submitting a membership application — Phase 2 Slice A.
//
// Rewritten from the dormant waitlist version. The old code collected name +
// email from an anonymous visitor and wrote to Airtable + Resend. The new model
// is account-bound: the applicant is already a signed-in Tier 1 account, so:
//   - email comes from the session, never typed;
//   - name + neighborhood are written back to the accounts row (so the byline
//     name gets set as a side effect of applying — closes the Slice 2 "name not
//     collected" gap for real members);
//   - the paragraph and the LinkedIn link are written to accounts too (bio,
//     linkedin_url — 2026-09-08), so joining builds the member profile;
//   - occupation and the sponsor reference live only on the applications row.
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
import { createClient } from "@/lib/supabase/server";
import {
  sendApplicantConfirmation,
  sendReviewerPing,
  sendSponsorshipRequest,
} from "@/lib/applications/emails";

export type SubmitApplicationState = { error: string | null };

// Postgres error codes we care about.
const RLS_VIOLATION = "42501"; // is_member() gate fired (already a member)
const UNIQUE_VIOLATION = "23505"; // a pending application already exists

const MAX_NAME = 80;
const MAX_NEIGHBORHOOD = 60;
const MAX_OCCUPATION = 120;
const MAX_ABOUT = 1500;
const MAX_SPONSOR_REF = 200;
// Matches lib/profile/update.ts. A longer cap here would accept a link at the
// door that /profile/edit then refuses to save back.
const MAX_LINKEDIN = 200;

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
  // ---- 0. Spam guard (silent drop). ----
  // Two free, no-friction bot traps from ApplicationForm. We run them BEFORE
  // any DB write or email so a bot costs us nothing:
  //   - honeypot: a hidden "company" field a human never sees but a dumb bot
  //     fills in;
  //   - dwell time: a real applicant takes more than a couple of seconds to
  //     fill the form; a bot posts almost instantly.
  // On a hit we do nothing and redirect to /apply — the exact same outcome a
  // genuine submission produces — so the bot can't tell it was dropped and
  // won't adapt. No error, no log noise, no signal back to the attacker.
  const honeypot = formData.get("company");
  const loadedAt = Number(formData.get("form_loaded_at"));
  const tooFast = Number.isFinite(loadedAt) && Date.now() - loadedAt < 2500;
  if ((typeof honeypot === "string" && honeypot.trim() !== "") || tooFast) {
    redirect("/apply");
  }

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
  const linkedinRaw = pluck(formData, "linkedin_url");

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

  // LinkedIn is optional, and it is checked HERE rather than only at render
  // time. /members/[id] already refuses to link anything that is not a
  // linkedin.com host — a profile field is not a place to hand another member
  // an arbitrary outbound link on our say-so — but a value that silently never
  // renders is worse than one refused at the door, because the person who
  // typed it believes it is on their profile. Same rule, said out loud.
  let linkedinUrl: string | null = null;
  if (linkedinRaw) {
    if (linkedinRaw.length > MAX_LINKEDIN) {
      return { error: `Keep the LinkedIn link to ${MAX_LINKEDIN} characters or fewer.` };
    }
    const withScheme = /^https?:\/\//i.test(linkedinRaw)
      ? linkedinRaw
      : `https://${linkedinRaw}`;
    let host = "";
    try {
      host = new URL(withScheme).hostname.toLowerCase();
    } catch {
      return { error: "That LinkedIn link doesn't look right. Paste the whole address." };
    }
    if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) {
      return { error: "That needs to be a linkedin.com address, or leave it blank." };
    }
    linkedinUrl = withScheme;
  }

  // ---- 1. Write name + neighborhood back to the accounts row. ----
  // RLS "accounts: update own row" allows this; the protect_account_columns
  // trigger (0001) ignores name/neighborhood (they're not protected columns).
  // This is the byline-name side effect — applying sets the member's real name.
  // WHAT THIS WRITES IS THE POINT OF THE 2026-09-08 CHANGE. It used to write
  // name + neighborhood only, so the paragraph a person wrote about themselves
  // lived on the applications row and nowhere a member could ever read it: an
  // approved member arrived on the network as a name and an email. bio and
  // linkedin_url are the columns /members/[id] reads (0026), so filling in this
  // form is now what builds the profile. All four are unprotected columns —
  // the protect_account_columns trigger (0001) guards is_member, role and
  // sponsor_id, not these — and "accounts: update own row" is the policy.
  const { error: profileError } = await supabase
    .from("accounts")
    .update({
      name,
      neighborhood,
      bio: about,
      ...(linkedinUrl ? { linkedin_url: linkedinUrl } : {}),
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Failed to update account during apply:", profileError);
    return {
      error: "Something went wrong sending your application. Try again in a moment.",
    };
  }

  // ---- 2. Insert the application row. RLS is the real gate. ----
  // If this account arrived via an invite, attach the inviter as the sponsor —
  // derived server-side from the invite (inviter_for_me), never from user
  // input. Null for a walk-up applicant; approval then defaults to the founder,
  // exactly as before.
  const { data: inviterId } = await supabase.rpc("inviter_for_me");

  // Select the new id back so the reviewer ping can embed it (the approve
  // command in the email is keyed on this id).
  const { data: inserted, error: insertError } = await supabase
    .from("applications")
    .insert({
      account_id: user.id,
      occupation,
      about,
      sponsor_reference: sponsorReference,
      neighborhood,
      sponsor_id: (inviterId as string | null) ?? null,
      // status defaults to 'pending' in the schema.
    })
    .select("id")
    .single();

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

  // ---- 3. On-submit emails (both best-effort). ----
  // Two separate awaits, each in its own try/catch: the applicant confirmation
  // failing must not skip the reviewer ping (or vice versa), and neither mail
  // failure can lose the application — the row is already safely written above.
  if (user.email) {
    try {
      await sendApplicantConfirmation({ to: user.email });
    } catch (error) {
      console.error("Applicant confirmation email failed (application saved):", error);
    }
  }

  try {
    await sendReviewerPing({
      applicantName: name,
      email: user.email ?? "—",
      neighborhood,
      occupation,
      about,
      sponsorReference,
      applicationId: inserted.id,
    });
  } catch (error) {
    console.error("Reviewer notification email failed (application saved):", error);
  }

  // ---- 4. Sponsorship request (best-effort). ----
  // If the applicant named someone in "Know a member?", ask that member to
  // vouch. request_sponsorship (0025) only creates a request when the reference
  // matches a real member, and returns the sponsor's details so we can email
  // them; they confirm/decline on /sponsor-request/[token]. Fails soft — incl.
  // before the 0025 migration is applied — so a miss never touches the saved
  // application. The token is the 122-bit secret in the email link.
  if (sponsorReference) {
    try {
      const token = crypto.randomUUID();
      const { data: sponsorRows } = await supabase.rpc("request_sponsorship", {
        p_application_id: inserted.id,
        p_reference: sponsorReference,
        p_token: token,
      });
      const sponsor = Array.isArray(sponsorRows) ? sponsorRows[0] : null;
      if (sponsor?.sponsor_email) {
        await sendSponsorshipRequest({
          to: sponsor.sponsor_email,
          sponsorName: sponsor.sponsor_name ?? null,
          requesterName: name,
          token,
        });
      }
    } catch (error) {
      console.error("Sponsorship request failed (application saved):", error);
    }
  }

  // Success — a pending row now exists, so /apply renders the confirmation state.
  redirect("/apply");
}
