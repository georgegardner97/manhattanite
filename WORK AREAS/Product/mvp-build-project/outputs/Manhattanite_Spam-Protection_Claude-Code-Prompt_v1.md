# Claude Code prompt — Spam protection (Turnstile + honeypot)

> Copy everything in the box below into the Claude Code (Code tab) prompt. It's self-contained.
> Companion spec: `WORK AREAS/Product/mvp-build-project/outputs/Manhattanite_Spam-Protection_Build-Plan_v1.md`.

---

```
TASK: Add bot/spam protection to the membership funnel — Cloudflare Turnstile CAPTCHA on signup
plus a honeypot trap on the application form. This is the "Turnstile-only" decision (2026-06-30):
do NOT add email confirmation, and do NOT write any database migration. This slice is auth-layer +
frontend only.

WHY: The /apply queue is flooded with spam. Root cause: email confirmation is OFF in Supabase, so
signUp returns a session instantly (a bot with a fake email becomes a Tier-1 account and applies),
and there is no CAPTCHA anywhere. We are adding Turnstile (the wall) + a honeypot (free trap).

GUARDRAILS (do not cross):
- Do NOT touch RLS, the trust gate, the approval/welcome loop, or any SECURITY DEFINER function.
- Do NOT add a migration. No schema change. No Supabase SQL.
- Do NOT add email confirmation or change the post-signup redirect (still router.push("/listings")).
- Keep the diff minimal and self-contained. American spelling in all user-facing copy.
- tsc + eslint must be clean. Run a production build before finishing.
- Match the existing design system exactly (tokens: bone/ink/slate/park; Instrument Serif via
  font-serif; mh-link classes). Look at app/signup/page.tsx and app/components/ApplicationForm.tsx
  for the house style.

ENV VAR:
- New public env var NEXT_PUBLIC_TURNSTILE_SITE_KEY (the Turnstile *site* key — public, safe to ship).
- The Turnstile *secret* key is NOT used in this codebase — it lives only in the Supabase dashboard,
  which verifies the token server-side. Do not reference the secret anywhere in the repo.
- Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to .env.local. For local build/testing, use Cloudflare's
  "always passes" TEST site key: 1x00000000000000000000AA (document this in a code comment near where
  the key is read so it's obvious it must be swapped for the real key in Vercel).

BUILD:

1) New client component app/components/Turnstile.tsx
   - Loads the Turnstile script (https://challenges.cloudflare.com/turnstile/v0/api.js) once.
   - Renders the widget using NEXT_PUBLIC_TURNSTILE_SITE_KEY, theme matched to the site (light),
     normal or flexible size.
   - Exposes the verification token to the parent via an onVerify(token: string) callback, and an
     onExpire()/onError() that clears the token. Provide a way to RESET the widget (Turnstile tokens
     are single-use — after a failed/rejected signUp the widget must be reset so the user can retry).
   - If NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing, render nothing and log a dev warning (so local dev
     without the key doesn't crash — but see the signup gating below).

2) app/signup/page.tsx (client component — edit in place)
   - Render <Turnstile> in the form.
   - Hold captchaToken in state. Disable the "Create an account" button until a token is present
     (alongside the existing email/password checks).
   - Pass it through: supabase.auth.signUp({ email, password, options: { captchaToken } }).
   - On error, RESET the Turnstile widget and clear the token (the old token is now spent), then show
     the existing friendly error. Keep the existing "already exists" handling and the success
     router.push("/listings") + refresh UNCHANGED.
   - Add a friendly error branch for a captcha failure message from Supabase
     (e.g. "Couldn't verify you're human — please try again.").

3) app/components/ApplicationForm.tsx (client component — edit in place) — HONEYPOT
   - Add a hidden honeypot text input named "company" (a field a human never sees but a dumb bot
     fills). Hide it from real users AND assistive tech: wrap in a container with inline styles
     position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden, plus aria-hidden="true",
     tabIndex={-1}, autoComplete="off". Do not use a Tailwind "hidden"/display:none class (some bots
     skip display:none fields).
   - Add a hidden input named "form_loaded_at" whose value is the timestamp set when the form mounts
     (Date.now() in a useState initializer or useRef). This powers the dwell-time check below.

4) lib/applications/submit.ts (server action — edit in place) — SILENT DROP
   - At the very top of submitApplication, BEFORE any DB write or email, read the two new fields:
       const honeypot = formData.get("company");
       const loadedAt = Number(formData.get("form_loaded_at"));
   - If honeypot is a non-empty string, OR (loadedAt is a finite number AND Date.now() - loadedAt
     < 2500 ms), treat it as a bot: do NOTHING (no account update, no application insert, no emails)
     and redirect("/apply") so the bot sees the normal pending-confirmation state and can't tell it
     was dropped. Add a brief code comment explaining the silent-drop rationale.
   - Leave the rest of the function (validation, account update, insert, emails, sponsorship request)
     exactly as-is.

TEST (before declaring done):
- tsc + eslint clean; `next build` green.
- With the Cloudflare TEST site key locally: signup page renders the widget, the button is gated on
  the token, and a signUp call includes options.captchaToken (the test key always passes).
- Honeypot: a submitApplication call with "company" filled returns the success redirect WITHOUT
  inserting a row or sending email (verify by reasoning through the code path / a quick unit check).
- Dwell-time: a submit with form_loaded_at = Date.now() (i.e. <2.5s) is dropped the same way.
- No regression: existing members still sign in; the apply happy-path (honeypot empty, normal timing)
  still inserts + emails as before.

DEPLOY ORDER (IMPORTANT — say this back to George, don't skip):
- Commit + push this frontend FIRST and let Vercel deploy it. While Supabase CAPTCHA protection is
  still OFF, the captchaToken we send is simply ignored — signups keep working, nothing breaks.
- ONLY AFTER the deploy is live does George enable CAPTCHA in the Supabase dashboard (Auth → Bot/
  Attack Protection → Turnstile → paste the SECRET key) and set NEXT_PUBLIC_TURNSTILE_SITE_KEY in
  Vercel to the REAL site key. If Supabase CAPTCHA is enabled BEFORE the deployed frontend sends a
  token, all signups will fail — so do not enable it first.
- Report back when pushed so George can do the dashboard steps + a live signup test.

Commit messages: a feat(signup) commit for Turnstile and a feat(apply) commit for the honeypot, or
one feat(auth) commit — your call, keep it clean.
```

---

## After Claude Code reports back (George's steps)

1. **Cloudflare → Turnstile** → add a widget for `manhattanite.com` → copy the **site key** + **secret key**.
2. **Vercel** → set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to the real site key → redeploy.
3. **Supabase → Authentication → Bot/Attack Protection** → enable CAPTCHA → provider **Turnstile** → paste the **secret key**.
4. Live signup test (use a Gmail plus-alias). Confirm a real signup still works and the widget shows.
5. **Then** clear the existing spam from `/admin/applications` (protect first, clean second).

I can co-pilot steps 1–4 in your browser when you're ready.
