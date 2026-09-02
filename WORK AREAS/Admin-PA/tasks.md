# Tasks — Manhattanite

Master task tracker for the Manhattanite project. Tasks are grouped by status. Check off as completed; move closed items to the bottom.

Format per task:
- [ ] **Task** — context / why it matters. *(Source: …, added YYYY-MM-DD, area: …)*

---

## Open

- [ ] **WEEK 1 OF THE RECUT (by Sun 6 Sep) — launch prep.** Five things, in this order: test the invitation path end to end on a personal address; confirm `Test - Ignore` is off the site; secure the first two or three real offerings (Cole / Cody / mover / shop perk); write the community guidelines; decide hello@ vs info@. Plan: `Product/mvp-build-project/outputs/Manhattanite_MVP-Timeline_v3.md`. *(Source: timeline recut, added 2026-08-31, area: Product / Launch)*

- [ ] **WAVE-ONE BLOCKER: write down what happens to the people a removed member vouched for.** The finalised pitch says "if you break the rules, you're both out" — the product has no such rule, and the decision inventory records the gap. It is a two-line policy and it is now the strongest sentence in the pitch, so make it true rather than soften it. Needed before the first invitation on Mon 7 Sep. Related and still open from the same list: no probation before a new member can vouch, and no cap on how many one member may vouch for — neither blocks the pitch. *(Source: pitch finalisation session, added 2026-09-02, area: Product / Trust)*

- [ ] **Wire error reporting before the first wave** — nothing is capturing production errors, so a broken screen reaches you via a member rather than the system. **[Claude Code]** *(Source: timeline recut, added 2026-08-31, area: Product / Hardening)*

- [ ] **Send the first ten invitations (week of Mon 7 Sep, from Tue 8)** — ten, not twenty-five, so every one gets a personal reply the same week. The five friend interviews fold into this wave rather than running separately. *(Source: timeline recut, added 2026-08-31, area: GTM / Seed)*

- [ ] **Commit and deploy the two copy changes sitting on disk** — the edit-screen fix and the sponsor→vouched-for-by rename. Typechecked and lint-clean; Cowork cannot build or push. Ready-to-run prompt: `Product/mvp-build-project/outputs/Manhattanite_Vouched-Copy-Pass_Claude-Code-Prompt_v1.md`. It also picks up the `Test - Ignore` confirmation. **[Claude Code]** *(Source: 2026-08-31 session, added 2026-08-31, area: Product)*

- [ ] **Run the Week 12 Hardening session** — RLS audit with synthetic accounts (prove the trust gate holds at the API layer) + Sentry/Plausible/Resend verification. Ready-to-run prompt: `Product/mvp-build-project/outputs/Manhattanite_Week-12-Hardening_Claude-Code-Prompt_v1.md`. **[Claude Code]** *(Source: timeline Week 12 must-hit, added 2026-08-13, area: Product / Hardening)*

- [ ] **Run the First-Five-Offerings playbook** — the 5 offerings broken into ≤15-min micro-steps with ask scripts: `Growth/.../outputs/Manhattanite_First-Five-Offerings_Playbook_v1.md`. Order REVISED 2026-08-31 (George): **his own music-lessons listing is OUT as the opener — wrong calibre for a first post.** The first listings set the standard a visitor judges the network by, so they should be the strongest offerings, not the easiest to arrange. New opening order to be picked from Cole / Cody / the mover / the shop perk. Outcome: 3–4 first real members + 5 real listings across all three pillars. *(Source: Strawberry.me session + George, added 2026-08-13, area: GTM / Seed)*

- [ ] **Pick the 5 interview friends** — script in `Manhattanite_Strategy-Session_2026-08-13.md` §8; 5 minutes with your contacts list. *(Source: Strawberry.me session, added 2026-08-13, area: GTM / Research)*

- [ ] **Run 5 friend interviews** — the script in Strategy-Session §8. Feeds the audience decision (older/wealthier vs younger), the three-pillar test, and the vouched bench. *(Source: George mind dump, added 2026-08-13, area: GTM / Research)*

- [ ] **Message Cole to propose the pilot-scope partnership conversation** — suggested shape in Strategy-Session §5: scoped pilot (invitation language + first grassroots wave, 4–6 weeks, retainer or fixed fee), review before anything bigger. Cowork can draft the message. *(Source: George, added 2026-08-13, area: GTM / Team)*

- [ ] **Designer shortlist** — George's verdict: current design "too AI," wants a professional. First ask: Cole's network; then Manhattan editorial/brand studios. Brief package already exists (brand-guide v2 draft + photo rules + steal sheet + audit + screenshots). Serif/accent decisions FROZEN pending this. *(Source: George mind dump, added 2026-08-13, area: Product / Design)*

- [x] **Rework the one-line pitch — DONE 2026-09-02.** Finalised with George: two descriptions, spoken and written, in `Growth/.../outputs/Manhattanite_One-Line-Pitch_v2.md`. Pitch cards and their PDF rebuilt on it. *(Source: Marwan Roushdy meeting, added 2026-07-14, closed 2026-09-02, area: GTM / Positioning)*

- [ ] **Audience + pillar reconciliation decision (post-Newport)** — with interview data in hand: who is Manhattanite for (plutocratic consumer vs young professional), and is the three-pillar framing (discounts / services / trusted buy-sell) positioning language or a category roadmap change to `mvp-spec.md`? *(Source: George mind dump + coaching, added 2026-08-13, area: Strategy)*

## In progress

*(none)*

## Done

- [x] **Log the Richard Laermer meeting outcome** — closed 2026-08-13: **the meeting was postponed indefinitely** (it never happened; the 2026-08-01 note assuming it took place was wrong). Tracker: Laermer stays flagged "very important," status Contacted/parked — no re-chase scheduled; revisit when the seed wave is moving. *(Source: George, added 2026-08-01, closed 2026-08-13, area: GTM / Outreach)*

- [x] **Look into Angie's List as a competitor** — closed 2026-08-13 after 13 weeks stale, superseded: the services/trust competitive question is now part of the audience + pillar reconciliation thread (Strategy-Session §2–3), where it will get answered in context rather than as a standalone report. Reopen if a dedicated teardown is wanted. *(Source: George, added 2026-05-16, closed 2026-08-13, area: Product / Competitive research)*

- [x] **🚨 Address bot submissions to the application form** — resolved 2026-07-02: Cloudflare Turnstile live on signup/login/reset, Supabase CAPTCHA enforced, honeypot on the apply form, spam queue cleared. *(Source: George, added 2026-06-02, closed 2026-08-01 in housekeeping sweep, area: Product / Anti-spam)*

- [x] **Read First 1000 newsletter for founding-member acquisition ideas** — done 2026-08-01. The newsletter has pivoted to AI-building content; its classic first-1000-users case-study material plus Lenny Rachitsky's equivalent research were distilled into `Growth/founding-member-acquisition-project/outputs/First-1000_Acquisition-Notes_v1.md`. *(Source: Marwan Roushdy meeting, added 2026-07-14, closed 2026-08-01, area: Growth / Acquisition)*

- [x] **Send outreach email to Richard Laermer** — outreach done; meeting booked for Tue 2026-07-21, 13:00, Chrysler Building. First Manhattanite founding-member conversation. *(Source: George, added 2026-07-08, closed 2026-07-17, area: GTM / Outreach)*
