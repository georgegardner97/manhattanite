# Contact Slice — Build Plan

**Date:** 2026-06-09
**Why this slice:** It's the "capture the value" half of membership — the thing that makes being a member *do* something. Today listings are view-only for everyone. This wires up the spec's contact mechanic: **a form on each listing that forwards to the lister's email; the lister chooses whether to reply directly** (`mvp-spec.md` §Apartment listings). No in-app inbox (that's v2).

**Tier behaviour (from spec + the 2026-06-09 tier decision):** contacting is a **member-only action** (Tier 2). A logged-in Tier-1 account that tries to contact hits an **interaction gate** that explains why and points to membership — *not* a silent redirect. Logged-out → login.

---

## Scope

**In:**
1. `listing_contacts` table + a `SECURITY DEFINER` function to log a contact and return the lister's details (migration 0011).
2. A contact server action that logs the contact and sends the email.
3. A `/listings/[id]/contact` page: member → form; Tier-1 → interaction gate; guest → login.
4. Wire the already-stubbed "Message the lister" link on the listing detail page.
5. A new email template (contact → lister, **reply-to = the sender**, so the lister can reply directly).

**Out (flag, don't build):** in-app messaging/inbox (v2); an admin moderation UI for `listing_contacts` (the rows are logged now for history; review UI is later); rate-limiting/anti-spam beyond the member gate (note as a follow-up).

---

## Key design decision — how the lister's email is resolved (without leaking it)

The lister's email lives in `accounts`, which is **read-own only** under RLS — a member can't read another member's email directly. **Do NOT denormalize email onto `listings`** (the 0010 anon-teaser policy makes published listings publicly readable — that would leak every lister's email).

**Use a `SECURITY DEFINER` function** (same pattern as `approve_application`): the function runs as definer, enforces the rules inside, does the privileged read, and returns only what the server action needs to send the email. This keeps the privileged read inside a controlled, audited function and avoids putting the service-role key in the request path.

---

## File-by-file

### 1. `supabase/migrations/0011_listing_contacts.sql` (new)
- **Table `public.listing_contacts`:** `id uuid pk default gen_random_uuid()`, `listing_id uuid not null references listings(id) on delete cascade`, `sender_id uuid not null references accounts(id) on delete cascade`, `message text not null`, `created_at timestamptz not null default now()`.
- **RLS on:** no direct client `select`/`insert`/`update`/`delete` policies for `authenticated`/`anon` (writes go through the function below; reads are admin/moderation only, deferred). Locking it down is the safe default.
- **Function `public.log_listing_contact(p_listing_id uuid, p_message text)` `SECURITY DEFINER`:** guards in order — caller is signed in (`auth.uid()` not null); caller `is_member()` (else raise, the action maps it to the interaction gate); listing exists + is `published`; caller is **not** the listing's own author (no self-contact). Then `insert` a `listing_contacts` row (`sender_id = auth.uid()`). Return a single row: the lister's `email` + `name` (from `accounts` via `listings.author_id`) + the `listing.title`. `revoke all from public`; `grant execute to authenticated` (membership is enforced inside).

### 2. `lib/applications/emails.ts` (edit) — add the contact email
- Add `sendListingContact({ to, listerName, senderName, senderEmail, message, listingTitle, listingId })` — best-effort, same shape as the existing sends.
  - **From:** `Manhattanite <applications@manhattanite.com>` (reuse the verified sender).
  - **Reply-To:** `senderEmail` — this is what realizes "the lister chooses whether to reply directly." The lister just hits reply.
  - **Subject:** `Someone's interested in your listing — ${listingTitle}`.
  - **Body:** greeting to `listerName`, the sender's name, their message (`\n`→`<br/>`), a link to `https://manhattanite.com/listings/${listingId}`, and a line: "Reply to this email to reach them directly." Keep it editorial/simple — pull tone from `voice-and-copy.md`.

### 3. `lib/listings/contact.ts` (new) — the server action
- `useActionState` shape (mirror `lib/applications/submit.ts`). Steps: validate session (`getUser`); call `log_listing_contact(p_listing_id, p_message)` via supabase `rpc()` as the **authenticated** user (no service role needed — the function is SECURITY DEFINER); on success, fire `sendListingContact(...)` in its own try/catch (a mail failure must not lose the logged contact); return a confirmation state. Map the function's raise messages cleanly: not-a-member → a flag the page renders as the interaction gate; not-published / self-contact → a readable error.

### 4. `app/listings/[id]/contact/page.tsx` (new)
- **Guest** (no session) → `redirect("/login")`.
- **Tier-1** (logged in, `is_member=false`) → render the **interaction gate**, copy **verbatim from `voice-and-copy.md`** ("To message [name], you need a member account. Members are sponsored by an existing member or approved through application." + **Apply for membership →** / **I have an invite →**). Resolve `[name]` to the lister's display name if available (the byline `author_name` is on the listing row — use it; fine that it's denormalized).
- **Member** → render the contact form: a single **message** textarea; show the member's own name + email read-only (from session, so the lister knows who's reaching out). Submit via the action → confirmation state ("Your message is on its way."). Copy from `voice-and-copy.md`; if there's no contact-form block there, write minimal on-brand copy (American spelling) and run the five-point test.
- Include a "← Listing" back link.

### 5. `app/listings/[id]/page.tsx` (edit) — wire the stubbed link
- Uncomment the existing "Message the lister" `<Link href={/listings/${id}/contact}>` block.
- **Hide it on the viewer's own listing** (when `author_id === auth.uid()` — you can't contact yourself; the function rejects it anyway, but don't show the link). Show it to everyone else (guests/Tier-1 included — the `/contact` page does the gating + explains, per spec).

---

## Testing (mirror Slice A/B/C discipline; synthetic-member pattern)
- **Guest:** `/listings/[id]/contact` → redirect to `/login`.
- **Tier-1:** logged-in non-member → sees the **interaction gate** (not the form); Apply CTA points to `/apply`.
- **Member happy path:** stand up a **synthetic member** (insert auth.users → accounts row auto-created → set `is_member=true`), have it contact one of the **founder's** listings: confirm (a) a `listing_contacts` row exists (correct `listing_id`, `sender_id`, message), (b) the email lands at `info@manhattanite.com` with **reply-to = the synthetic member's address** and a link to the listing. Use the Gmail plus-alias for the synthetic sender so reply-to is verifiable.
- **Self-contact blocked:** founder → own listing's `/contact` → the link is hidden, and calling the function directly raises.
- **Cleanup:** delete the synthetic auth.users row (cascades to accounts + listing_contacts) + the test contact row; founder untouched (`is_member=true, sponsor_id=null`). Final: 0 synthetic rows.
- `tsc` + `eslint` clean on changed files; test on prod after deploy.

## Commits
- `feat(contact): member contact form → lister email + listing_contacts log (Phase 2)` [migration 0011, emails.ts, lib/listings/contact.ts, the two pages]
- `docs: contact slice plan + memory`
- Do **not** commit `.env.local`.

## Migration to run by hand (Cowork can drive)
`0011_listing_contacts.sql` — applied to prod via the SQL editor (new untitled snippet) before deploy, same as 0010. Claude Code should pause and give the exact SQL; Cowork runs it.

## After build → Cowork
Reconcile, mark the contact slice SHIPPED, and note the remaining walkthrough items (signup-name + copy pass, seed listings + photos, edit/delete UI, Phase 1.5 restyle). Seed listings + photos is the gate to the second "does it look finished" walkthrough checkpoint.
