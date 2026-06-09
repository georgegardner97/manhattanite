# Manhattanite — /apply Slice C Email Copy (v1)

Send-ready copy for the three membership emails. Drafted against `COMPANY/voice-and-copy.md` (American spelling, Soho House register, no generic transactional language). Each one has passed the five-point test at the end of this doc.

**Decision locked (2026-06-08):** no decline email at seed. A declined application stays silent for now (revisit later). Only the two applicant-facing emails below — plus the reviewer ping — get built.

**Sender convention:** all applicant-facing email sends from `Manhattanite <applications@manhattanite.com>`. The reviewer ping lands in `info@manhattanite.com`. Resend is already verified for the domain, so no new DNS work.

---

## 1. Applicant confirmation

**Trigger:** fires on submit, server-side, right after the `applications` row is written. To the applicant (email from session).
**From:** `Manhattanite <applications@manhattanite.com>`
**To:** the applicant
**Subject:** We've got your application.

**Body:**

> Thanks for applying.
>
> We read every application personally, which means it'll take a few days. We'll be in touch either way.
>
> In the meantime, if you know a member of Manhattanite who'd vouch for you, ask them to send a note. Sponsored applications move faster.
>
> — Manhattanite

**Notes:**
- No name greeting on purpose — opens on "Thanks for applying," matching the in-product confirmation state so the email and the screen say the same thing.
- No CTA button. There's nothing for them to do yet; adding one would be noise. The one action available ("ask a member to vouch") is stated in plain words.
- Dynamic fields: none. Static copy, same for every applicant.

---

## 2. Reviewer ping (refines the Slice A send)

**Trigger:** fires on submit, same moment as email #1. This is the trimmed Resend notification carried over from the dormant waitlist code and already sending since Slice A — this is its finished form.
**From:** `Manhattanite <applications@manhattanite.com>`
**To:** `info@manhattanite.com`
**Subject:** New membership application — {{applicant_name}}

**Body:**

> {{applicant_name}} just applied for membership.
>
> **Neighborhood:** {{neighborhood}}
> **Occupation:** {{occupation}}
> **Brought in by:** {{sponsor_reference or "—"}}
>
> **In their words:**
> {{about}}
>
> ---
> To approve (sends the welcome email):
> `npm run approve -- {{application_id}}`
>
> Or, no email:
> `select public.approve_application('{{application_id}}');`
>
> To decline:
> `select public.decline_application('{{application_id}}', 'optional note');`

**Notes:**
- This one is internal and functional, not brand copy — short, factual, never marketing (per the notifications tone rule). It exists to let George act in two clicks.
- Embedding the exact commands turns the email into the review tool itself — no need to go hunt the application ID. This is the Slice B "SQL-driven review" made convenient.
- **Reconciled at build (2026-06-09):** the shipped action block leads with `npm run approve -- {{application_id}}` (the CLI path that fires the welcome email), keeping the raw `approve_application()` SQL as the no-email fallback. Updated above to match the shipped ping.
- Dynamic fields: `applicant_name`, `neighborhood`, `occupation`, `sponsor_reference` (fall back to "—" when null), `about`, `application_id`.

---

## 3. Welcome / approved — "You're in."

**Trigger:** fires from the approve path. The approve transaction itself is the Slice B Postgres function; the welcome email is a Node-side send. So the wiring is: a thin server action wraps `approve_application()` → on success, fire this email. Email stays out of the database trigger. **This is the brand moment** — the spec calls it the most important send in the flow.
**From:** `Manhattanite <applications@manhattanite.com>`
**To:** the newly approved member
**Subject:** You're in.

**Body:**

> You're in.
>
> Welcome to Manhattanite. Your account is active and you can start browsing now.
>
> A few things worth knowing:
>
> **You can sponsor others.** Bring in people you'd want to live next to. Sponsorship is public, and it counts.
>
> **Listings move quickly.** Especially apartments. If you see something you like, message the poster through the site.
>
> **Quality matters more than quantity.** If you post a listing, make it worth a member's time.
>
> Start here: **[Browse listings →]**

**Notes:**
- Lifted verbatim from the "Application approved" block in `voice-and-copy.md` — it was already written to final standard, so no reason to reinvent it.
- CTA `Browse listings →` links to `https://manhattanite.com/listings`. Approved members land in the network, not on a settings page.
- Dynamic fields: none required. (A "Hi {{first_name}}," line is available if you'd rather open warm — `first_name` derives from `accounts.name` by taking the first token. My lean: keep the cold "You're in." open. It's stronger.)

---

## What's deliberately not here

- **No decline email** — locked decision above.
- **No `needs_info` email** — when you move an application to `needs_info`, the applicant can re-apply (the one-pending index frees up). If you want to tell them why, that's a manual note for now, not a templated send. Flag if you want it built.

---

## Five-point voice test (from `writing-rules.md`)

Each email checked against all five before shipping:

| Email | Specificity | Necessity | Voice | Action | Honesty |
|---|---|---|---|---|---|
| **1. Confirmation** | "a few days," "personally" — concrete, no vague "soon" | three sentences, none spare | "We read every application personally" — unmistakably Manhattanite | the one available action (ask a member to vouch) is stated | "we'll be in touch either way" — no false promise of yes |
| **2. Reviewer ping** | name, neighborhood, occupation, the SQL itself | functional only, zero marketing | correctly *not* brand voice — internal notification register | approve/decline commands embedded | states exactly what happened, nothing more |
| **3. Welcome** | "Especially apartments," "message the poster through the site" | every line earns its place | "You're in." — could be no other brand | "Browse listings →" — obvious next step | "make it worth a member's time" — sets the bar honestly, no hype |

All three pass. No rewrites needed.

---

## Hand-off to the build (next step — [Claude Code])

When you're ready to wire these up, the build lane is:

1. `lib/applications/emails.ts` — three templated send functions (confirmation, reviewer ping, welcome) using the existing Resend client.
2. `lib/applications/submit.ts` — call the confirmation send + the (refined) reviewer ping after the row insert.
3. A thin server action wrapping `approve_application()` — on success, fire the welcome send. This is the only genuinely new plumbing; the rest is copy-into-template.

I'll write the full Slice C build plan (exact file diffs + the test loop) when you give the word — same level of detail as the Slice 5/6 plans.

---

*Drafted 2026-06-08. Source of truth for copy is `COMPANY/voice-and-copy.md`; if a line here ever drifts from the guide, the guide wins.*
