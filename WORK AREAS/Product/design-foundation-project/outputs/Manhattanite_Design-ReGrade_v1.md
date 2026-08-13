# Design re-grade (v1) — the before/after close-out

**Dated 2026-08-01.** The final deliverable of the Design Foundation plan: the Phase 0 audit (2026-07-17) re-scored after Slices 1–3, Phase 4A, Phase 5, and the mobile pass. **Method note, honestly stated:** Phase 0 was graded from live screenshots; this re-grade is desk-based — scored from the shipped, prod-verified change record (session log 2026-07-17 → 2026-07-22 + the 2026-08-01 prod check). Every underlying change was individually verified on prod when it shipped. A fresh screenshot pass (esp. the logged-in screens via George's Chrome) would firm up the C+→A claims; recommended but optional. Before-screenshots: `outputs/before-screenshots/`. Mobile afters: `outputs/mobile-pass-screens-2026-07/`.

---

## The headline

Phase 0's summary was: *"a solid structure rendered in the wrong type with no action system."* Both halves are gone. The fonts load (fixed 2026-07-17, the same day they were found broken), and the site has a designed action grammar (boxed actions, underlined links). Every screen was reworked inside one system. **No screen was above B in July. Nothing assessed below B+ now.**

## Screen by screen

| Screen | Was | Now | What changed |
|---|---|---|---|
| Landing | (not captured) | **A−** | Full rebuild: dark park ground, full-bleed hero with chrome overlaid, statement block, image band, editorial footer. The strongest screen — held back only by the soft 1400px hero (retina swap pending). |
| Browse `/listings` | B− | **A−** | The flagship steal shipped: dated editorial listing card, sticky left category rail, "Today's listings." — an edited page, not a feed. |
| Listing detail | B− | **A−** | Editorial grid, serif title + price, hairline metadata table, boxed MESSAGE THE LISTER (the audit's "looks disabled" finding, solved structurally). Placeholder "bug" was diagnosed as lazy-load, not a defect. |
| Contact modal | B | **A−** | Inherits the system: kicker, boxed textarea, boxed send. |
| Post a listing | B | **B+** | Boxed fields, dashed uploader, "Submit for review" with the moderation notice moved beside it. Long single scroll remains (accepted). |
| My listings | C+ | **A−** | The structural fix: archived listings are compact hairline rows under their own heading — an archived item can never outweigh a live one again. |
| Profile | C+ | **B+/A−** | Out of the centered stack into the editorial grid; sponsorship as a small-caps credential line — closer to a membership card than a receipt. |
| Profile edit | B− | **B+** | Boxed fields; the once-inconsistent boxed "add a photo" is now the deliberate dashed-uploader pattern. |
| Auth (login/signup/resets/apply) | B− | **A−** | The dark threshold: shared AuthShell on park, boxed inputs, dark Turnstile, pressable submits. The tier wall is now *visible*. (Dark /apply form still unseen by human eyes — needs a Tier-1 session; low risk, shares verified primitives.) |
| Admin ×2 | B | **B+** | Functional tidy inside the system; admin remains deliberately exempt from full treatment. |
| Terms/Privacy | B | **B+** | System typography and spacing. |
| Emails | (Phase 5, ungraded) | **A−** | All sends rebuilt on one email-safe layout: true wordmark PNG, Instrument-with-Georgia-fallback headlines, boxed CTA, plain-text alternatives. |
| Mobile (all routes) | (not captured) | **B+/A−** | Full iPhone pass: 16px input floor (no zoom-on-focus), svh hero, safe-area insets, 44px tap targets, one-row footer, no horizontal overflow at 390/375. Known holes: hero soft at DPR 3, no srcset on listing photos (deferred image-transform slice). |

## Cross-cutting findings from Phase 0 — closed?

1. Typography bug — **closed** (2026-07-17). 2. No action affordance — **closed** (boxes-for-actions system). 3. Listing card undesigned — **closed** (flagship steal). 4. Detail placeholder — **closed** (not a bug). 5. No accent — **superseded** (dark/light split carries the identity; accent formally open, not missed). 6. Archived-listing weight — **closed** (structural). Plus the brand items Phase 0 listed as gaps: wordmark, favicon, OG — all **shipped** (Phase 4A).

## What keeps the site off a straight A

The soft hero photo (the one open *asset*, not design, problem); serif numeral-1-as-l in body sizes (live-use review); no srcset on listing images (mobile data cost); the unviewed dark /apply form; and the site has never been graded with real member content at volume — the system was designed for the B-grade photo, and that thesis meets reality when the first 20 members post.

## Verdict

The brief was "chic, eye-catching, elegant, easy to navigate, very professional." The July audit found a B− site with good bones in the wrong clothes. What ships today is one coherent editorial system across every surface — screens, emails, favicon, share card, phone — with decisions recorded and tokens named. **The Design Foundation project is done pending George's sign-off on the two paper deliverables (photo rules, brand-guide v2) and the optional fresh screenshot pass.** Remaining design-adjacent work (hero asset, serif review, srcset) is logged backlog, not project scope.
