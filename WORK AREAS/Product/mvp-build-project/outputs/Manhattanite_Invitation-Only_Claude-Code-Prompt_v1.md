# Claude Code prompt — invitation only: the tiers come out, the vouching rule goes in

**Written by Cowork, 2026-09-04. Twelve files changed on disk. `tsc --noEmit` clean outside `_to_delete/`, eslint 4 across `app lib scripts` — the baseline, unmoved. Cowork cannot run `next build`, `audit:gates` or push, so this is verify-and-ship.**

## The two decisions behind it

**1. George, 4 Sep: "I want to scrap the tiered thing for now. You are either a full member brought in by someone else or you are not. No in-between."** Asked whether an invitation alone makes someone a member, he kept his own approval: invited → set a password → tell us who you are → George approves → member. The queue is a queue, not a tier.

**THE DATABASE DOES NOT MOVE. `accounts.is_member` was always a boolean and every RLS policy already keys off it.** "Tier 1" was never a database state — it was the fact that anyone could manufacture an `is_member = false` account from the front page and then live there indefinitely. Scrapping the tiers means **closing that door**, not migrating anything. No migration, no policy change, no backfill. An invited-but-unapproved person is still `is_member = false`, which is correct and is now the only way that state is reachable.

**2. George, same day: "If someone violates the community terms then they and their sponsors are assessed in the same way."** The word is **assessed, not removed** — a voucher's judgment gets reviewed under the same standard at the same time, they are not automatically expelled. This closes a wave-one blocker open since 2 September.

## What changed (12 files)

**The self-serve door is closed:**
- **`app/(cl)/signup/page.tsx`** — now `redirect("/apply")`. Redirect, not 404: the address is in the wild (waitlist-era emails, bookmarks, the old design system's links). **`ClJoinForm` calls `supabase.auth.signUp` directly and never touched this route, so closing it does not touch the invite chain.** Verify that explicitly.
- **`app/components/cl/ClAccess.tsx`** — the guest card is now "Invitation only / A member has to bring you in", the three steps are rewritten (a member invites you → you set a password and tell us who you are → a person reads it), the "Create an account" pill is gone, and the sign-in pane's footer reads "Manhattanite is invitation only." **The `pane="signup"` branch is left in place, unreachable, so reopening the door is one file rather than a rebuild.**
- **`app/(cl)/listings/page.tsx`** — the guest teaser wall stops selling an account: "This is a glimpse. The rest of the network is for members, and a member has to bring you in." CTA is now Sign in.
- **`app/components/cl/ClGate.tsx`** and **`app/(cl)/page.tsx`** — "Request access" relabelled "How to join" in both places, because there is no access to request. The landing footer link also moved from `/login` to `/apply`, now the screen that explains the shape.
- **`app/(cl)/apply/page.tsx`** — title is "Invitation only · Manhattanite".

**`app/(cl)/terms/page.tsx` — two clauses rewritten:**
- **Who can use Manhattanite** no longer says "an account is free and open to anyone with an email address", which goes false the moment this ships. It now describes the invitation-only shape, including the honest part: while an application is being read you can look around, and membership is what lets you act.
- **Membership and vouching** replaces the old blanket disclaimer ("a member who vouches for someone is not responsible for, and does not warrant, the conduct of the people they bring in") with **two deliberately separate paragraphs**: the membership standard (break the terms and the members who vouched for you are assessed the same way, at the same time, by the same people) and the legal position (vouching is still not a warranty and does not make you responsible for what someone else does). They were merged before, which is how a legal disclaimer ended up flatly contradicting the pitch.

**The invite page, rewritten twice in one day:**
- **`app/(cl)/invite/page.tsx`** — "There is no other way in. Invite someone you'd vouch for out loud — your name stays beside theirs for as long as they're here, and if they break the terms, your own membership is looked at the same way."
- **`app/components/cl/ClInviteForm.tsx`** — the footnote says where the name appears (their profile and every listing they post), that the membership is assessed alongside theirs, and that a person reads every new member by hand.
- **The copy deliberately said less until the rule existed.** It was written that morning without the consequence, because the product had no such rule; it gained the sentence only once `/terms` carried it. **The word is ASSESSED, not removed. Do not sharpen this into an automatic consequence without changing the Terms first** — the file comments say so.

**The first entry point into /invite:**
- **`app/(cl)/profile/page.tsx`** — a "Bring someone in" section and an Invite rail row, members only. `/invite` has worked since the invite slice and **nothing in the product linked to it**; the only way in was typing the address. Fourth instance of the orphaned-route pattern after /admin, /search and /listings/mine, and the worst, because the others stranded a screen while this stranded the growth loop. Gated on `is_member` — RLS refuses a Tier-1 insert and `/invite` redirects them away, so the button would be a door into a wall. The same file's account-closure link moved from `hello@` to `info@`.

**Wave-one copy calls (from the morning's walk):**
- **`app/(cl)/listings/[id]/page.tsx`** — "Report anything off and we'll take it down" removed. There is no report control. "Read by a person before it went live" stays, because it is true.
- **`lib/applications/emails.ts`** — from-address is now `Manhattanite <info@manhattanite.com>` (was `applications@`, which nobody had decided on), and the invite email lost "It's why there are no scams, no spam, and no strangers." from **both** HTML and plain-text bodies.

## Verify

- `next build` exits 0. **Watch one thing:** `tsc --noEmit` reports an error in `_to_delete/exercise-outcome.ts`, a puppeteer scratch file from 2 Sep. `tsconfig.json` includes `**/*.ts` and excludes only `node_modules`, so it is in the type-check graph. If it fails the build, add `_to_delete` to tsconfig's `exclude` — do not delete the folder.
- **eslint baseline is 4 across `app lib scripts`.** Confirmed unchanged. Do not fix the pre-existing `prefer-const` in `scripts/audit-rls.ts` here.
- `npm run audit:gates` local and against production. First run since 2 Sep. **The guest-anonymity assertions matter more than usual** — the teaser copy changed on the same screen they read.
- **Walk it signed out:** `/` → footer "How to join" → `/apply` reads invitation-only with no form → `/listings` teaser wall offers Sign in → a seventh listing gives ClGate with Sign in / How to join → `/signup` redirects to `/apply` → an old `/join/<token>` link still renders the claim form with a live Turnstile widget → `/terms` reads correctly and both vouching paragraphs render as two paragraphs.
- **Walk it as a member:** `/profile` shows Bring someone in, the rail anchor works, the button reaches `/invite`, an invitation sends, and the email arrives from info@ without the removed sentence.
- **Walk it as the one Tier-1 account in prod** (`george.gardner480@gmail.com`, `is_member=false`): no Invite section, no rail row, and `/apply` still answers them honestly. That account is now unreachable by any new person, which is the point — but it exists, and what it sees is worth one look.

## Then

Commit and push. Code then docs, as usual. Sweep the ~16 uncommitted files under `WORK AREAS/` and `COMPANY/` into the docs commit — the 2026-07-20 rule: those get committed at the end of every session or a git operation can wipe them.

## Not done, on purpose

- **No report control built.** George's call was to remove the copy. The gap stays on the decision inventory.
- **AppHeader untouched.** Its nav is deliberately two items. Whether inviting earns a header slot — or a phone tab-bar slot — is George's call.
- **`COMPANY/mvp-spec.md`, `product-vision.md` and `strategy-blueprint.md` still describe the two-tier model as the core mechanic.** The reversal is in `decisions.md` and the session log; the strategy documents need their own pass. `/privacy` was checked and carries no tier or free-account language.
- **`COMPANY/trust-and-moderation.md` has no procedure for running a shared assessment**, which the Terms now promise. On the task list, not in this batch.
- **The assessment does NOT cascade — decided 2026-09-04 (George), and `/terms` says so out loud in its own paragraph.** One step: the people who vouched for the member in question, not whoever vouched for those people in turn. Do not implement, report on, or write copy that assumes a chain.
- **The Terms are plain English written by Cowork, not by a lawyer**, and already sit on the deferred attorney-review list. This clause joins it.
