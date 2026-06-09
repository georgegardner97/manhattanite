# Slice C — Claude Code hand-off prompt

**How to use:** open the **Code** tab and paste everything in the box below as one message. It's self-contained — Claude Code has the repo, so it references existing files and only spells out the new copy verbatim. Do the `.env.local` step it asks for when it asks (one paste from your Supabase dashboard).

---

```
We're building /apply Slice C — the three membership emails — in the Manhattanite repo. Plan + verbatim copy already exist at:
- WORK AREAS/Product/mvp-build-project/outputs/Apply-Route_Slice-C-Build-Plan_v1.md
- WORK AREAS/Product/mvp-build-project/outputs/Manhattanite_Apply-Emails_v1.md

Read both first. Copy is the source of truth — lift it verbatim, American spelling, no generic transactional chrome. Decision already made: build the CLI approval script (Option A). No decline email, no needs_info email.

Build it in this order:

1) lib/applications/emails.ts (new). Instantiate Resend once from process.env.RESEND_API_KEY. Export three best-effort async functions (each returns void; callers handle try/catch):
   - sendApplicantConfirmation({ to }) — from "Manhattanite <applications@manhattanite.com>", subject "We've got your application.", body = the three-line confirmation from the copy doc. No dynamic fields.
   - sendReviewerPing({ applicantName, email, neighborhood, occupation, about, sponsorReference, applicationId }) — to info@manhattanite.com, subject `New membership application — ${applicantName}`. Body = neighborhood / occupation / brought-in-by (fallback "—") / the about paragraph (\n→<br/>), then an action block. IMPORTANT action-block change vs the copy doc: lead with the script path now, keep raw SQL as fallback:
       To approve (sends the welcome email): npm run approve -- <applicationId>
       Or, no email: select public.approve_application('<applicationId>');
       To decline: select public.decline_application('<applicationId>', 'optional note');
   - sendMemberWelcome({ to }) — from "Manhattanite <applications@manhattanite.com>", subject "You're in.", body = the welcome block from the copy doc, CTA "Browse listings →" linking https://manhattanite.com/listings. No dynamic fields.
   Keep the HTML simple/inline-styled and editorial — short enough that a heavy template fights the voice.

2) lib/applications/submit.ts (edit). Replace the inline reviewer-ping Resend block (~lines 154–175) with calls to the new module. After the successful insert, fire BOTH sendApplicantConfirmation({ to: user.email }) AND sendReviewerPing({...}) — separate awaits, each in its own try/catch so one failing doesn't skip the other and a mail failure never breaks the saved application. To get applicationId for the ping, change the insert to .insert({...}).select("id").single() and pass that id through. Remove the now-dead inline Resend import/instantiation from submit.ts.

3) scripts/approve-application.ts (new) + package.json "approve" script. Reads argv: <application-id> (required), <sponsor-id> (optional). Steps: (a) call approve_application(app_id, sponsor_id) against the DB via a privileged connection; (b) read email + name from public.accounts for the approved account; (c) await sendMemberWelcome({ to: email }); (d) log "Approved <name> (<email>) — welcome email sent." Surface the Postgres raise exception messages cleanly (already a member / not pending / sponsor not a member) as a single readable line, not a stack trace.
   Privileged connection: the approve_* functions are SECURITY DEFINER with `revoke all from public`, so the anon key can't call them. Pick the cleaner of: (i) SUPABASE_SERVICE_ROLE_KEY via supabase-js rpc() — may need `grant execute on function public.approve_application(uuid,uuid) to service_role;` (add as migration 0009 if so); or (ii) direct Postgres via `pg` using SUPABASE_DB_URL. Tell me which you chose and exactly what to paste into .env.local. Add the secret name(s) to .gitignore coverage — .env.local is already gitignored; never commit the value. Add devDep tsx if needed and "approve": "tsx scripts/approve-application.ts".

4) app/apply/page.tsx — read it; only touch it if the confirmation state needs a one-line "check your inbox" nicety. Not required.

Then: pause and tell me the exact .env.local line to add. After I confirm it's in, run the test loop on prod (mirror the Slice A/B synthetic-applicant pattern):
   a) flip founder is_member=false, go to /apply, submit → confirm TWO emails land (applicant confirmation + reviewer ping with the npm run approve line) and a pending applications row exists with the id shown in the ping;
   b) run npm run approve -- <that-id> → confirm application approved, account is_member=true, sponsor_id=founder, the "You're in." welcome email lands, and the member can reach /listings/new;
   c) cleanup: restore is_member=true, sponsor_id=null, delete the test application row; final check 0 applications, founder untouched.
   tsc + eslint clean on changed files before committing.

Commit (two commits):
   - feat(apply): membership emails — confirmation, reviewer ping, welcome (Phase 2 Slice C)  [lib/applications/emails.ts, lib/applications/submit.ts, scripts/approve-application.ts, package.json, and migration 0009 if added]
   - docs: Slice C copy + build plan + Claude Code prompt + memory  [the outputs docs]
   Do NOT commit .env.local.

When done, give me a one-paragraph summary + anything that needs my eyes (especially the env step and the test results).
```

---

## After Claude Code reports back (→ [Cowork])

Ping me and I'll: (1) reconcile the one-line copy divergence into `Manhattanite_Apply-Emails_v1.md` (the ping now leads with `npm run approve`), (2) log Slice C as SHIPPED in project memory, and (3) **run the walkthrough checkpoint** — the agreed "explore the live site" pause, now that the full visit → account → browse → apply → approved → post loop works end to end.
