// Server action for contacting a lister — Phase 2, the contact slice.
//
// Mirrors lib/applications/submit.ts. The member fills in a single message on a
// listing's /contact page; this action logs the contact and forwards it to the
// lister by email (reply-to = the member, so the lister replies directly).
//
// The privileged work happens inside log_listing_contact() (migration 0011), a
// SECURITY DEFINER function: it enforces every rule (signed in, member, listing
// published, not self-contact), writes the listing_contacts row, and returns the
// lister's email + name + the listing title — all without the service-role key
// touching the request path. We call it via rpc() as the authenticated user.
//
// Returns a discriminated state for useActionState in the client form:
//   - "sent"  → confirmation copy
//   - "gate"  → the member gate (defense-in-depth; the page already gates Tier-1)
//   - "error" → a readable message (listing gone, self-contact, generic)

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendListingContact } from "@/lib/applications/emails";

export type ContactState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "gate" }
  | { status: "error"; message: string };

// SQLSTATE codes raised by log_listing_contact() (0011).
const ERR_NOT_MEMBER = "MH001";
const ERR_NOT_PUBLISHED = "MH002";
const ERR_SELF_CONTACT = "MH003";

const MAX_MESSAGE = 2000;

type ContactRow = {
  lister_email: string | null;
  lister_name: string | null;
  listing_title: string;
};

function pluck(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export async function sendContact(
  _prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const listingId = pluck(formData, "listing_id");
  const message = pluck(formData, "message");

  if (!listingId) {
    return { status: "error", message: "Something went wrong. Try again in a moment." };
  }
  if (!message) {
    return { status: "error", message: "Add a message before sending." };
  }
  if (message.length > MAX_MESSAGE) {
    return {
      status: "error",
      message: `That's a little long — keep it under ${MAX_MESSAGE} characters.`,
    };
  }

  // The function is the gate: it logs the contact and returns the lister's
  // details, or raises with a SQLSTATE we map below. Called as the authenticated
  // user — no service role; the function is SECURITY DEFINER.
  const { data, error } = await supabase.rpc("log_listing_contact", {
    p_listing_id: listingId,
    p_message: message,
  });

  if (error) {
    if (error.code === ERR_NOT_MEMBER) {
      return { status: "gate" };
    }
    if (error.code === ERR_NOT_PUBLISHED) {
      return { status: "error", message: "This listing isn't available anymore." };
    }
    if (error.code === ERR_SELF_CONTACT) {
      return { status: "error", message: "This is your own listing — you can't message yourself." };
    }
    console.error("log_listing_contact failed:", error);
    return { status: "error", message: "Something went wrong sending your message. Try again in a moment." };
  }

  // The function returns SETOF (one row); PostgREST hands it back as an array.
  const lister = (data as ContactRow[] | null)?.[0];

  // The contact is logged. The email is a best-effort forward — a mail failure
  // must NOT lose the recorded contact, so it's wrapped in its own try/catch.
  if (lister?.lister_email && user.email) {
    // The member's own name (for the lister's "from"). RLS read-own.
    const { data: account } = await supabase
      .from("accounts")
      .select("name")
      .eq("id", user.id)
      .single<{ name: string | null }>();

    try {
      await sendListingContact({
        to: lister.lister_email,
        listerName: lister.lister_name,
        senderName: account?.name ?? null,
        senderEmail: user.email,
        message,
        listingTitle: lister.listing_title,
        listingId,
      });
    } catch (mailError) {
      console.error("Listing contact email failed (contact logged):", mailError);
    }
  }

  return { status: "sent" };
}
