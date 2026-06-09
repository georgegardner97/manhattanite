# Contact Slice — Claude Code hand-off prompt

**How to use:** open the **Code** tab and paste everything in the box below as one message. Self-contained — Claude Code has the repo. It'll pause for one migration line (the `listing_contacts` table), same as the last two slices; Cowork can run it for you.

---

```
We're building the Contact slice in the Manhattanite repo. Full plan at:
- WORK AREAS/Product/mvp-build-project/outputs/Contact-Slice_Build-Plan_v1.md

Read it first, plus the contact spec in COMPANY/mvp-spec.md and the interaction-gate + tone copy in COMPANY/voice-and-copy.md (copy is the source of truth — lift verbatim, American spelling). This is the spec's contact mechanic: a member-only form on each listing that forwards to the lister's email; the lister replies directly (no in-app inbox — that's v2). Tier-1 accounts hit an interaction gate, not a redirect. Logged-out → login.

Build in this order:

1) supabase/migrations/0011_listing_contacts.sql (new).
   - Table public.listing_contacts: id uuid pk default gen_random_uuid(); listing_id uuid not null references listings(id) on delete cascade; sender_id uuid not null references accounts(id) on delete cascade; message text not null; created_at timestamptz not null default now(). Enable RLS with NO client select/insert policies (writes go through the function below; reads are admin-only, deferred).
   - Function public.log_listing_contact(p_listing_id uuid, p_message text) SECURITY DEFINER. Guards in order: auth.uid() not null; public.is_member() (else raise — the action maps this to the interaction gate); listing exists and status='published'; caller is NOT the listing's author (no self-contact). Then insert a listing_contacts row (sender_id = auth.uid()). Return one row: the lister's email + name (accounts joined via listings.author_id) + the listing title. revoke all from public; grant execute to authenticated (membership is enforced inside the function). Match the style of approve_application in 0008.

2) lib/applications/emails.ts (edit). Add best-effort sendListingContact({ to, listerName, senderName, senderEmail, message, listingTitle, listingId }): from "Manhattanite <applications@manhattanite.com>", REPLY-TO: senderEmail (this is how the lister replies directly), subject `Someone's interested in your listing — ${listingTitle}`, body = greeting to listerName + senderName + the message (\n→<br/>) + a link to https://manhattanite.com/listings/${listingId} + "Reply to this email to reach them directly." Keep it editorial/simple.

3) lib/listings/contact.ts (new). useActionState server action, mirror lib/applications/submit.ts. Validate session; call log_listing_contact(p_listing_id, p_message) via supabase rpc() as the authenticated user (NO service role — the function is SECURITY DEFINER); on success fire sendListingContact(...) in its own try/catch (a mail failure must not lose the logged contact); return a confirmation state. Map the function's raises: not-a-member → a flag the page renders as the interaction gate; not-published / self-contact → a readable error.

4) app/listings/[id]/contact/page.tsx (new).
   - guest (no session) → redirect("/login").
   - Tier-1 (is_member=false) → render the interaction gate, copy VERBATIM from voice-and-copy.md ("To message [name], you need a member account…" + Apply for membership → / I have an invite →). Resolve [name] from the listing's author_name byline.
   - member → contact form: a single message textarea; show the member's own name + email read-only (from session); submit via the action → confirmation ("Your message is on its way."). Pull copy from voice-and-copy.md; if there's no contact-form block, write minimal on-brand copy (American spelling) + run the five-point test.
   - include a "← Listing" back link.

5) app/listings/[id]/page.tsx (edit). Uncomment the existing "Message the lister" Link to /listings/${id}/contact. HIDE it when author_id === auth.uid() (can't contact your own listing); show it to everyone else (the /contact page does the gating + explains).

Then: pause and give me the exact SQL to run for migration 0011 (new untitled snippet in the Supabase editor — Cowork will run it). Don't rely on it being live until I confirm. After it's run + deployed, run the test loop on prod:
   - guest: /listings/[id]/contact → redirect to /login.
   - Tier-1: logged-in non-member → sees the interaction gate (not the form), Apply CTA → /apply.
   - member happy path: stand up a SYNTHETIC member (insert auth.users → the trigger makes the accounts row → set is_member=true) using the Gmail plus-alias george.gardner480+contact@googlemail.com as its email; have it contact one of the FOUNDER's listings → confirm (a) a listing_contacts row (right listing_id, sender_id, message), (b) the email lands at info@manhattanite.com with reply-to = the synthetic member's address + the listing link.
   - self-contact: founder → own listing → link hidden; calling the function directly raises.
   - cleanup: delete the synthetic auth.users row (cascades) + the test contact row; founder untouched (is_member=true, sponsor_id=null); final 0 synthetic rows.
   tsc + eslint clean on changed files before committing.

Commits:
   - feat(contact): member contact form → lister email + listing_contacts log (Phase 2)  [migration 0011, emails.ts, lib/listings/contact.ts, the two pages]
   - docs: contact slice plan + memory
   Do NOT commit .env.local.

When done, give me a one-paragraph summary + anything that needs my eyes (the migration line and the test results).
```

---

## After Claude Code reports back (→ Cowork)
Ping me and I'll run migration 0011, reconcile any drift, mark the contact slice SHIPPED, and tee up the next walkthrough item — likely **signup-name + the copy pass**, then **seed listings + photos** (which unlocks the "does it look finished" walkthrough checkpoint).
