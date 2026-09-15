# Claude Code prompt — nothing is visible or accessible until a member is approved

**George's decision, 2026-09-15, after walking the real invitation flow on prod:**

> "I think we should get rid of the right panel that allows them to browse once they've logged in. Its confusing. They shouldn't be able to see anything until their account has been approved. It ads the mystery. I know this goes against what I've said before. Nothing should be visible or accessible until they are approved."

**This is a deliberate reversal and he named it as one.** The "look around while you wait" affordance was a considered choice; it is now withdrawn. Do not treat any existing comment defending it as a reason to soften this. Update those comments instead.

**Already done, do not redo:** the invitation email now names all four categories and its button reads "Accept invitation and create account". Those strings are in `lib/applications/emails.ts` in the working tree, uncommitted, alongside a site wide no dashes copy pass. Leave both alone.

---

## The rule

An account that exists but is not yet a member (`accounts.is_member = false`) sees **nothing of the product**. No listings, no member names, no counts, no empty states hinting at what is inside. The only screens it can reach are the one that takes its profile, the one that says it is being reviewed, and sign out.

A **member** is untouched by every part of this. So is a logged out stranger, for now (see the open question at the end).

---

## 1. `/apply` becomes a single card

Today `ClAccess` renders a two column grid: the profile or review card on the left, and a second panel on the right that says "You're signed in", shows the email address, and offers **Browse listings** next to **Sign out**. George's screenshots show this in both states, and the browse button is the loudest control on the screen at the moment a person has just been told to wait.

- Drop the right hand panel entirely **for a signed in viewer**. The pane still exists for a logged out one, where it is the sign in form and is the point of the screen.
- With one card, do not let it stretch to the full 1100px. Constrain the single card case so it reads as a deliberate single column.
- **Sign out must survive.** Removing that panel is currently the only way a non member can sign out, and stranding someone signed in with no exit is worse than the problem being fixed. Move it into the bottom of the remaining card as a quiet line: the address they are signed in as, and a sign out control. Keep it a POST form, not a link, for the reason already in the file.
- The member branch (`isMember`) keeps its "You're a member" card and its **Browse listings** button. A member reaching `/apply` is in.

## 2. The waiting copy stops inviting them in

The pending state currently reads: *"A person reads every profile. You'll get an email as soon as you're confirmed, usually within a week. You can look around in the meantime."* with a **Look around meanwhile** button.

- Remove the final sentence and remove the button.
- What replaces the button is nothing. A card that says you are being reviewed, and no onward control, is the intended effect: George's word for it is mystery.
- Check `ClGate` too. Its secondary button deep links to `#request` on this screen, and any copy of its that promises a look around goes the same way.

## 3. A signed in non member is gated out of the product

**Establish the truth before changing anything.** In `lib/cl/listings-read.ts` the split is `const isGuest = !user`, so a signed in non member does **not** take the guest teaser branch; it falls through to the member query and is held back only by whatever RLS then allows. Probe production with a real non member session and find out exactly what that returns today. Write down the answer. Do not assume it is zero rows, and do not assume it is six.

Then make every product route answer a signed in non member by sending them to `/apply`: browse, listing detail, member profiles, search, post, my listings, edit, contact. The wall copy that currently explains membership to them is no longer wanted on those routes; the destination is the review card.

**Prefer one gate over eight.** If these routes already share a helper or a layout, put the check there. If the honest answer is that they do not, say so rather than scattering eight copies of the same three lines.

**Do not weaken RLS to achieve this, and do not rely on the UI alone.** Whatever the database currently permits a signed in non member to read, it should permit no more after this change. If closing this properly needs a migration, write it as `-- PROPOSED — NOT YET APPLIED` and tell George to run it; do not apply it yourself.

## 4. The route audit will fail, and that is correct

`scripts/audit-gates.ts` asserts the behaviour being reversed. Several cases send a non member fixture at `/listings` and friends and expect a wall or a filtered browse. Those assertions are now wrong.

- Retarget them to assert the new truth: a signed in non member is redirected to `/apply` from every product route.
- Add an assertion that `/apply` for a signed in non member contains **no** link to `/listings`, `/listings/new` or `/profile`, and no member name. That is the rule this whole change exists to hold, and a rule with no assertion regresses silently.
- **Do not delete an assertion to make a run go green.** If one has to go, say which and why in the session log.
- Eleven exact copy strings are pinned in that file. The no dashes pass in the working tree was checked against all eleven and moves none of them, but re run it rather than trusting that sentence.

---

## Verification

- `next build`, `tsc --noEmit`, eslint against its 4 error baseline.
- `audit:gates` against a **warm** dev server, and `audit:rls` at 67/67 with production unchanged.
- Drive it in a real browser at desktop and 375px, as three different people: a signed in non member with a pending application, a member, and a logged out visitor. The first must find no way into the product and a working way out of the session.
- Confirm the email address on the sign out line is the person's own and appears nowhere a crawler can read it.

## Commit

Commit at the end, including `COMPANY/` and `WORK AREAS/` docs. Session log entry at the TOP of `COMPANY/memory/session-log.md`, and record the reversal in `COMPANY/memory/decisions.md` with George's own words and the date, because it overturns a documented earlier decision and the next person to read the old note needs to find the new one.

---

## One open question for George, not for you

A **logged out** visitor can still read six published listings on `/listings` — the guest teaser. That predates this decision and George's instruction was about the invited person, so leave it in place. Flag it in the session log as the obvious next question: if nothing is visible until approved, the teaser is the last thing still visible to someone who is not.
