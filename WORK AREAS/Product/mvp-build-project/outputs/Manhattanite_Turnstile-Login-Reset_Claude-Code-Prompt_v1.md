# Claude Code prompt — Add Turnstile to login + password-reset pages

> Copy everything in the box into the Claude Code (Code tab) prompt. Self-contained.
> Context: Supabase CAPTCHA protection was enabled, which guards ALL auth endpoints — but the
> Turnstile widget was only added to /signup. So /login and the reset-request flow now fail with
> "captcha protection: request disallowed (no captcha_token found)". This adds the widget to the
> pages that need it.

---

```
TASK: Supabase CAPTCHA (Turnstile) protection is now ENABLED, which requires a captcha token on
every auth-INITIATING call: signUp, signInWithPassword, and resetPasswordForEmail. The Turnstile
widget currently only exists on /signup, so /login and /reset-request now break with
"captcha protection: request disallowed (no captcha_token found)". Add the Turnstile widget +
captchaToken to the pages that call a captcha-gated method, reusing the component already built for
signup.

DO NOT:
- Do NOT create a new Turnstile component — REUSE the existing app/components/Turnstile.tsx from the
  signup slice (same NEXT_PUBLIC_TURNSTILE_SITE_KEY, already set in Vercel).
- Do NOT change any Supabase dashboard setting, env var, RLS, or the signup page.
- Do NOT add a migration.
- Do NOT add the widget to a page whose only auth call is updateUser or verifyOtp — those are NOT
  captcha-gated (see the reset-password note below).

PAGES TO FIX:

1) app/login/page.tsx  (calls supabase.auth.signInWithPassword — captcha-gated → NEEDS the widget)
   - Render <Turnstile> in the form (mirror exactly how signup/page.tsx does it).
   - Hold captchaToken in state; disable the "Sign in" button until a token exists (alongside the
     existing email/password checks).
   - Pass it through: signInWithPassword({ email, password, options: { captchaToken } }).
   - On ANY sign-in error, RESET the Turnstile widget and clear the token (tokens are single-use, so
     a spent token must be refreshed before the user retries), then show the existing error. Add a
     friendly branch for a captcha failure ("Couldn't verify you're human — please try again.").
   - Leave the successful-login redirect and all other behavior unchanged.

2) app/reset-request/page.tsx  (calls supabase.auth.resetPasswordForEmail — captcha-gated → NEEDS it)
   - Same treatment: render <Turnstile>, gate the submit button on the token, pass
     options: { captchaToken } into resetPasswordForEmail, reset the widget + clear the token on
     error, friendly captcha-failure copy. Keep the "check your email" confirmation state unchanged.

3) app/reset-password/page.tsx  (the SET-A-NEW-PASSWORD page)
   - FIRST check which Supabase method it calls. If it only calls updateUser (setting the new
     password from the recovery-link session) and/or verifyOtp, it is NOT captcha-gated — leave it
     UNCHANGED, no widget. Only add the widget here if it actually calls a captcha-gated method
     (signInWithPassword / signInWithOtp / resetPasswordForEmail / signUp). State in your report
     which method it uses and whether you touched it.

STYLE: match signup/page.tsx and the house design system exactly (bone/ink/slate/park tokens,
Instrument Serif via font-serif, mh-link classes, American spelling). The widget placement should
read the same as on signup (below the password field / above the submit).

TEST (before finishing):
- tsc + eslint clean; `next build` green.
- Reason through each page: the button stays disabled until a token exists; the token rides into the
  auth call as options.captchaToken; a failed call resets the widget so a retry gets a fresh token.
- Confirm signup/page.tsx is unchanged and the reset-password page decision is correct.

DEPLOY:
- Commit (a feat(auth) commit is fine) and push to main; Vercel auto-deploys. NEXT_PUBLIC_TURNSTILE_
  SITE_KEY is already set in Vercel, so the widget will render with the real key — no env work.
- Supabase CAPTCHA stays ON the whole time (that's intended — this fix is what makes login work WITH
  it on).
- Report back when pushed so George can live-test login + password-reset on prod.
```

---

## After Claude Code pushes (live test — George)

Once Vercel shows the new deploy **Ready**:

1. **manhattanite.com/login** → the Cloudflare box should appear and show "Success!" → sign in with your admin (`info@manhattanite.com`). It should log you straight in, no red error.
2. Optionally test **Forgot password?** → the reset-request page should also show the box and send the email.
3. Then we're finally clear to **clean up the spam queue** and delete the throwaway test accounts.

If login still errors after the deploy is live, tell me and I'll re-check the console — but with the widget on the page and the key already correct in Vercel, it should just work.
