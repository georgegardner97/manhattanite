# Manhattanite — Spam Protection Build Plan (v1)

**Date:** 2026-06-30
**Trigger:** Returned from 10 days off to a flooded membership-application queue.
**Goal:** Close the doors that let bots sign up and apply, then clear the polluted queue.
**Scope discipline:** This protects the *front door* (signup + apply). It does not touch the trust wall, RLS, or the approval moat — those already hold. Nothing got *into* membership; the queue is just noise.

> **DECISION (2026-06-30, George): Turnstile-only.** Ship Layer 2 (Cloudflare Turnstile CAPTCHA) + Layer 3 (honeypot, free). **Layer 1 (email confirmation) is DEFERRED** — keep instant signup for now; revisit if spam still trickles through after Turnstile is live. This means the big `signup/page.tsx` "check your inbox" rework in §3 is **not** part of this slice — the page only gains the Turnstile widget + token. Rationale: keep signup frictionless during seed; Turnstile stops the automated flood, which is the bulk of the problem. Email confirmation is a one-setting + one-page-state add later.

---

## 1. The diagnosis — where the spam gets in

Confirmed by reading the live code this session (`app/signup/page.tsx`, `app/apply/page.tsx`, `lib/applications/submit.ts`, `app/components/ApplicationForm.tsx`):

| # | Open door | Why it lets spam through | Severity |
|---|---|---|---|
| 1 | **Email confirmation is OFF in Supabase Auth** | `signUp` returns a live session immediately — a bot uses a fake/disposable email it never has to open, and is instantly a Tier-1 account that can apply. | **Critical — the root cause** |
| 2 | **No CAPTCHA** on signup or apply | Nothing proves a human is present; the whole signup→apply loop is scriptable in milliseconds. | **High** |
| 3 | **No honeypot, no rate limiting, no dwell-time check** | Nothing traps naive bots or throttles volume. | Medium |

**What's already working (don't undo it):**

- One-pending-application-per-account (a partial unique index; `submit.ts` handles `23505`). One fake account = one spam application, not hundreds.
- The approval moat: only George flips `is_member`. No bot became a member.
- Length caps on every field (name 80, neighborhood 60, occupation 120, about 1500, sponsor ref 200).

So the spam volume ≈ the number of fake accounts created. Shut the signup door and the apply queue stops filling.

---

## 2. The fix — four layers, in priority order

Defense in depth. Layer 1 and 2 do ~95% of the work; 3 and 4 are cheap insurance.

### Layer 1 — Turn ON email confirmation (root-cause fix)
**Where:** Supabase Dashboard → Authentication → Sign In / Providers → Email → **Confirm email = ON**.
**Effect:** `signUp` no longer returns a session. The user must click a link in a real inbox before they can log in — so a working, reachable email is now required to even reach the apply form. Kills the disposable-email flood.
**Cost:** Real UX change. Signup becomes a two-step flow (sign up → check inbox → confirm → log in). The signup page currently assumes an instant session and pushes straight to `/listings`; that has to change (see §3).
**This is the one decision that needs George's sign-off** — see §6.

### Layer 2 — Cloudflare Turnstile CAPTCHA on signup (strongest single lever)
**Why Turnstile:** You already run Cloudflare (per `tech-architecture.md`), it's free, privacy-friendly, and usually invisible (no "click the traffic lights"). Supabase Auth has **native CAPTCHA support** — you don't hand-roll verification.
**Where:**
1. Cloudflare Dashboard → Turnstile → add a widget for `manhattanite.com` → get a **site key** (public) + **secret key** (private).
2. Supabase Dashboard → Authentication → **Attack Protection / Bot Protection → Enable CAPTCHA → provider: Turnstile → paste the secret key.**
3. Code: render the Turnstile widget on `/signup`, pass the token into `supabase.auth.signUp({ email, password, options: { captchaToken } })`. Supabase verifies it server-side and rejects signups without a valid token.
**Effect:** Even with a real email, a bot must solve a CAPTCHA per signup. This is the wall that actually stops automated signup at scale.
**Cost:** Low. One env var (the site key), a small widget component, one extra option on the `signUp` call.

### Layer 3 — Honeypot + dwell-time on the application form (free, invisible)
**Where:** `app/components/ApplicationForm.tsx` + `lib/applications/submit.ts`.
- **Honeypot:** add a hidden field (e.g. `company` or `website`) positioned off-screen / `aria-hidden`, not a real input a human sees. Bots fill every field; humans can't. If it's non-empty on submit, silently drop the application (return the normal success state so the bot can't tell it failed).
- **Dwell-time:** stamp a hidden `rendered_at` timestamp when the form loads; if submission arrives < ~2–3 seconds later, treat as bot. (Optional — honeypot alone catches most.)
**Effect:** Traps naive bots at zero cost to real applicants. Belt-and-braces behind Layers 1–2.
**Cost:** Trivial — a few lines, no migration, no dashboard work.

### Layer 4 — Rate limiting + disposable-email block (optional, defer if 1–2 land)
- Supabase Auth has built-in per-IP signup rate limits — check they're at sane values (Dashboard → Auth → Rate Limits). No code.
- Optionally reject known disposable-email domains at signup (a small blocklist). Low value once Layer 1 is on (disposable inboxes can't confirm anyway). **Recommend deferring.**

---

## 3. Code changes (file-by-file)

**`app/signup/page.tsx`** (the biggest change — driven by Layer 1)
- Add the Turnstile widget; capture `captchaToken` in state; pass it into `signUp({ ..., options: { captchaToken } })`.
- Replace the instant `router.push("/listings")` with a **"Check your inbox to confirm your email"** confirmation state (email confirmation now means no session is returned). Copy from `COMPANY/voice-and-copy.md` register — editorial, calm, American spelling.
- Handle the new error/edge cases (unconfirmed email trying to log in → friendly nudge to confirm).

**New: `app/components/Turnstile.tsx`** (or inline)
- Small client component that loads the Turnstile script and renders the widget, calling back with the token. Reads the **site key** from `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

**`app/components/ApplicationForm.tsx`** (Layer 3)
- Add the hidden honeypot input + the hidden `rendered_at` timestamp field.

**`lib/applications/submit.ts`** (Layer 3)
- Early in `submitApplication`: if the honeypot is non-empty (or dwell-time too short), short-circuit and `redirect("/apply")` as if it succeeded — no row written, no email sent. Silent drop.

**`/login` (`app/login/page.tsx`)** — minor
- Surface a clear message when a not-yet-confirmed user tries to sign in ("Confirm your email first — check your inbox").

**Env vars (Vercel + `.env.local`):**
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public site key). The **secret** key lives only in the Supabase dashboard, not in the repo.

**No database migration required.** This is auth-layer + frontend only. (A nice clean slice — nothing to hand-run in the SQL editor.)

---

## 4. What George does in dashboards (the non-code part)

1. **Supabase → Auth → Email → Confirm email = ON.** (Layer 1)
2. **Cloudflare → Turnstile → create widget for manhattanite.com →** copy site key + secret key. (Layer 2)
3. **Supabase → Auth → Attack/Bot Protection → enable CAPTCHA → Turnstile → paste secret key.** (Layer 2)
4. **Vercel → add `NEXT_PUBLIC_TURNSTILE_SITE_KEY`** env var. (Layer 2)
5. Sanity-check Supabase Auth rate limits aren't wide open. (Layer 4)

Claude Code does the code in §3; these five are the human-in-dashboard steps. I can walk you through each one live via the browser when you're ready.

---

## 5. Clearing the existing spam queue (after protection is up)

Order matters: **protect first, then clean**, or you're bailing a boat with the hole still open.

- Review `/admin/applications` and identify the spam rows (fake names, gibberish `about`, link-stuffed text, throwaway emails).
- Bulk-decline them. Two routes:
  - **Quick:** a one-off SQL update in the Supabase editor (e.g. set spam rows to `status='declined'`, or hard-delete the fake `auth.users` rows so the accounts + applications cascade away — same pattern the test harnesses use for cleanup). Founder-safe with a `where` clause that excludes real applicants.
  - **In-product:** decline them one by one from the admin queue (fine if the count is small).
- **No decline email fires at seed** (decisions.md, 2026-06-08), so clearing spam won't spray emails at fake inboxes. Good.
- Decide the threshold for "real vs spam" together before any bulk delete — anything ambiguous gets left for manual review.

---

## 6. The one decision for George

**Do we turn on email confirmation (Layer 1)?**

- **Yes (recommended).** It's the root-cause fix and it fits the brand — a trust network *should* want real, reachable emails. Cost: signup becomes two-step (sign up → confirm → log in), and the signup page gets a "check your inbox" state.
- **Turnstile-only (Layer 2 alone).** Lighter touch, keeps instant signup. Stops automated signups, but a determined human/cheap-labour spammer with real throwaway inboxes could still trickle through. Weaker, but zero added friction for real users.

**Recommendation: do both** — Turnstile is the wall, email confirmation makes each fake account expensive to create *and* reachable-only. Honeypot is free, add it regardless.

---

## 7. Test plan (after build)

1. **Happy path:** real signup → Turnstile passes → confirmation email arrives → confirm → log in → `/apply` → application lands in the queue. (Use a Gmail plus-alias so it's a readable inbox.)
2. **CAPTCHA wall:** a signup attempt with no/invalid captcha token is rejected by Supabase.
3. **Honeypot:** a submit with the hidden field filled is silently dropped — no row, no email. Verify against the DB.
4. **No regression:** existing members can still log in; the approval/welcome loop still fires; the trust gate still holds at every tier.
5. **Queue is quiet:** confirm no new spam rows accumulate over 24–48h post-deploy.

---

## 8. Sequencing recommendation

1. George confirms §6 (email-confirm yes/no).
2. George does the 5 dashboard steps in §4 (I can co-pilot via the browser).
3. Claude Code builds §3 → commit + push → Vercel deploys.
4. Run §7 test plan on prod.
5. **Then** clear the existing queue (§5).
6. Log to project memory + decisions.

> **Note:** this is *also* a good moment to ship the parked 0024 + 0025 migrations and the uncommitted UX/landing work from 16 June — they've been waiting on a SQL run + a Claude Code push. Worth bundling the push, separate from this spam slice, so the diffs stay clean.
