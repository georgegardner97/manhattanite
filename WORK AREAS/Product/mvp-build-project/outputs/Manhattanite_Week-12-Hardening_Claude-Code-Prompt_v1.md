# Week 12 Hardening — Claude Code session prompt (v1)

**Dated 2026-08-13.** The Week 12 must-hit in one executable session: prove the trust gate cannot be bypassed, then verify observability and email deliverability. Target: ~90 min for Part 1, ~60 min for Part 2. Write findings to `WORK AREAS/Product/mvp-build-project/outputs/Manhattanite_RLS-Audit_v2.md` (v1, from June, predates migrations 0011–0025). Commit docs at session end per the standing rule.

## Ground rules

- **Test on prod** — localhost auth is still blocked at Cloudflare (test Turnstile key vs real secret; known issue since 30 June). Local dev also talks to the production DB, so prod-with-synthetic-accounts is the honest environment anyway.
- **Synthetic accounts only; the founder row is never touched.** Use Gmail plus-aliases (the established pattern). Full cleanup ritual at the end: delete synthetic listings, storage objects (via Storage API — direct `storage.objects` deletes are blocked, error 42501), applications, accounts.
- **Attack the API, not just the UI.** The UI already gates correctly; the audit's point is PostgREST + supabase-js with the anon key, hitting tables directly. A trust gate that only exists in React is not a trust gate.

## Part 1 — RLS audit (the must-hit)

Current surface (migrations 0001–0025): `accounts`, `listings`, `applications`, `listing_contacts`, `sponsorships`, `invites`, `sponsorship_requests`, plus storage buckets `listing-images` and avatars. Three principals to test: **anon**, **Tier-1 account** (synthetic), **member** (synthetic, approved via `npm run approve`). For each cell: attempt via supabase-js with the anon/user JWT and record allow/deny.

**Anon must be limited to:** teaser read of published listings (0010) + listing-image read (0018). Must FAIL: reading accounts, applications, contacts, sponsorships, invites, sponsorship_requests; any insert/update/delete anywhere; reading unpublished/archived listings.

**Tier-1 account must be able to:** read published listings + images; read/update own `accounts` row (name, neighborhood, bio only); insert own application when not member (0007); read own application. Must FAIL — this is the wall itself: inserting a listing; inserting a `listing_contacts` row (contact is member-only); creating invites; creating/responding to sponsorship requests as sponsor; reading other rows in accounts/applications; **privilege escalation:** updating own `is_member`, `sponsor_id`, or role columns (the `protect_account_columns` trigger — try it explicitly); calling `approve_application()` with the user JWT (0009 grants execute to service_role only — must fail for authenticated).

**Member must be able to:** insert/update/archive own listings (0003/0014); upload/delete own listing images; contact another member's listing (0011); create invites (0020); see own connections (0024). Must FAIL: updating/deleting another member's listing; reading another member's contacts/invites; admin reads (0015) as a non-admin.

**Storage:** with no JWT, attempt a direct object URL (not signed) on `listing-images` — must fail; signed URLs must work; cross-user delete must fail.

**Also verify the moderation wall:** a member's newly inserted listing is not publicly visible until approved (0017 pre-moderation), including via direct table read as another account.

Record every attempt (principal · table · operation · expected · actual) in the audit doc. Any unexpected ALLOW is a launch-blocker finding — fix in-session if small (policy patch migration), else log at the top of the doc.

## Part 2 — Observability + deliverability

1. **Sentry:** confirm the DSN is set in Vercel env (not just `.env.local`); trigger a deliberate server error on a throwaway route or via an invalid action on prod; confirm the event arrives in the Sentry project; delete the test route if one was added.
2. **Plausible:** confirm the script renders on every route class (landing, browse, detail, auth, terms — view-source on prod); confirm a live pageview registers in the dashboard; check the domain is `manhattanite.com` (non-www).
3. **Resend deliverability — closes a long-open loose end:** send a real contact-form message on prod to a listing owned by a synthetic member whose email is a real inbox George can read (plus-alias). Verify it LANDS (inbox, not spam), Reply-To is the sender, the neighborhood line renders. Then check SPF/DKIM/DMARC alignment for manhattanite.com in the Resend dashboard and confirm the apply-flow emails still send (submit one synthetic application; then clean up).
4. **Two 5-second extras while in prod:** favicon renders in the browser tab (Phase 4A eyeball, open since 21 Jul); no console errors on landing + browse.

## Cleanup + close

Delete all synthetic rows and storage objects; confirm founder row untouched (`is_member=true`, `sponsor_id` null); write the audit doc; update `mvp-build-project/memory.md` and `COMPANY/memory/session-log.md`; **git commit code + docs**. If everything passes, Week 12's must-hit is done in one day — say so loudly in the session log so Friday is genuinely overflow.
