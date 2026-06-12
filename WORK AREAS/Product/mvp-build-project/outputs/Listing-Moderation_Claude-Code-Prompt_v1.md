# Listing Moderation — Claude Code hand-off prompt v1

Paste everything in the box into Claude Code (Fable 5), running in the `manhattanite` repo.

---

```
Build the Listing Moderation slice for Manhattanite — the last big v1 feature. DECISION (George):
PRE-MODERATION. New listings are reviewed by an admin before going public; nothing reaches the
network without a human yes.

READ FIRST (in full):
- WORK AREAS/Product/mvp-build-project/outputs/Listing-Moderation_Build-Plan_v1.md  (complete spec)
- AGENTS.md (Next 16 breaking changes)
- supabase/migrations/0003_listings.sql (status enum + the update policy),
  0014_listings_owner_archive.sql, 0015_admin_console.sql (admin-guard + grant pattern to copy),
  0016_listings_read_own.sql
- lib/listings/create.ts, app/listings/mine/page.tsx, app/listings/[id]/edit/page.tsx
- app/admin/* and lib/admin/* (mirror the Admin Console patterns), COMPANY/voice-and-copy.md

THE TRUST-CRITICAL RULE — get this exactly right:
A member must NEVER be able to publish their own listing. Enforce it in the DATABASE, not the UI.
Publishing is admin-only via a SECURITY DEFINER function; a BEFORE UPDATE trigger governs which
status transitions each caller may make. UI checks are the clean UX layer on top — keep both.

MIGRATION supabase/migrations/0017_listing_moderation.sql (Build Plan §"Schema"):
1. Add 'pending' to the listings status check (keep 'draft'); confirm the constraint's real name first.
2. Add moderation_note text (nullable).
3. BEFORE UPDATE trigger enforce_listing_status_transition(): service-role/admin → any change;
   member → allow same→same (content edit), pending|published→archived (take down),
   draft→pending (resubmit); BLOCK anything→published and all else (raise 42501). SECURITY DEFINER.
4. Recreate listings_write_member_own_update WITH CHECK = (author_id=auth.uid() AND is_member())
   only — drop the status allowlist; the trigger now owns status logic.
5. approve_listing(id) [pending→published], return_listing(id,note) [pending→draft + note],
   reject_listing(id,note) [pending|published→archived + note] — all SECURITY DEFINER, each opening
   with the SAME admin guard as 0015, granted to authenticated + service_role.
6. End with verify queries.

FRONTEND (Build Plan §"Frontend"):
- lib/listings/create.ts: insert status:'pending' (was 'published').
- /listings/new confirmation: review-aware copy from voice-and-copy.md ("in review… we'll let you
  know once it's live").
- /listings/mine: remove the .eq('status','published') filter; show ALL own listings with status
  badges (In review / Live / Needs changes / Archived). For 'draft' (returned) listings show
  moderation_note + a Resubmit control. Keep Edit/Remove.
- lib/listings/resubmit.ts: own+member action, draft→pending.
- app/admin/moderation/page.tsx: admin-gated queue of status='pending' listings (full detail), with
  Approve / Return-with-note / Reject-with-note per listing.
- lib/admin/moderate.ts: server actions calling approve_listing/return_listing/reject_listing via rpc
  as the authenticated admin (mirror lib/admin/review.ts).
- /admin dashboard: add a "pending review" count + link to /admin/moderation.

TEST HARNESS scripts/test-listing-moderation.ts (mirror scripts/test-multi-sponsor.ts; service-role
key, synthetic admin + member, auto-cleanup, founder untouched) — Build Plan §"Test harness":
post→pending (not on public browse, visible to owner); MEMBER CANNOT SELF-PUBLISH (direct
update→published raises — the key assertion); admin approve→published & public; return→draft+note→
member resubmit; reject→archived+note; non-admin cannot call the 3 functions; member archive still
works; cleanup to 0 synthetic rows, founder's 3 published listings untouched.

STOP AND WAIT: after building + the harness, STOP and tell me it's ready for the 0017 SQL run.
Do NOT deploy. Cowork applies 0017 in the prod SQL editor first; then you re-run the harness against
prod, and if green commit + push (Vercel deploys).

GUARDRAILS:
- Members can never self-publish — DB-enforced. Moderation functions admin-guarded + granted to
  authenticated. Never weaken either.
- American spelling; all user-facing copy in the Soho-House voice from voice-and-copy.md.
- If the plan conflicts with the actual code, STOP and flag it — don't improvise.
```

When it pauses, come back and I'll apply `0017` in the SQL editor, then we finish + verify (including a quick re-run of the RLS audit, since this slice adds a trigger and touches the update policy).
