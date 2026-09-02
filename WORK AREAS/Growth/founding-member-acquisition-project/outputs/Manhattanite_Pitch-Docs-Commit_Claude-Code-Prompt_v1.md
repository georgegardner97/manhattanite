# Claude Code prompt — commit and push the pitch docs (v1)

**Dated 2026-09-02.** Paste the block below into Claude Code in the `manhattanite` repo. It commits documentation only. There are no code changes in this batch.

Cowork wrote these files directly to disk but cannot push (the device bridge has no network access), and the standing rule from the 2026-07-20 doc-revert incident is that `COMPANY/` and `WORK AREAS/` changes get committed at the end of every session or they can be wiped by later git operations.

**Already handled:** a stale, empty `.git/index.lock` from 10:45 today was moved to `_to_delete/index.lock.stale-2026-09-02-1045`. If a new one appears, it is a live process, not a leftover.

---

## The prompt

```
Commit and push today's documentation work in the manhattanite repo. Docs only — there are no code changes in this batch, so if you find any, stop and tell me rather than sweeping them in.

Today's session finalised the founding-member pitch. Nine files changed, all documentation:

New:
- WORK AREAS/Growth/founding-member-acquisition-project/outputs/Manhattanite_One-Line-Pitch_v2.md
- WORK AREAS/Growth/founding-member-acquisition-project/outputs/Founding-Members_Pitch-Cards_v2.md
- WORK AREAS/Growth/founding-member-acquisition-project/outputs/Founding-Members_Pitch-Cards_v2.pdf
- WORK AREAS/Growth/founding-member-acquisition-project/outputs/Manhattanite_Pitch-Docs-Commit_Claude-Code-Prompt_v1.md

Modified:
- WORK AREAS/Growth/founding-member-acquisition-project/generators/generate_pitch_cards_pdf.py
- WORK AREAS/Growth/founding-member-acquisition-project/memory.md
- WORK AREAS/Admin-PA/output-log.md
- WORK AREAS/Admin-PA/tasks.md
- COMPANY/memory/session-log.md
- COMPANY/memory/decisions.md

Steps:

1. `git status`. Compare what is actually dirty against the list above.
   - Extra files under `WORK AREAS/Admin-PA/daily/` or `captains-log/` are expected — include them, they are the same class of change.
   - Anything under `app/`, `lib/`, `scripts/`, `supabase/` or any config file is NOT expected. If you find any, list it and stop. Do not commit it and do not stash it.
   - `_to_delete/` is scratch. Leave it out.

2. Stage only documentation paths. Do not use `git add -A`.

3. Commit with this message:

   Docs: the pitch is finalised — two descriptions, and shared liability

   The one-line pitch decision, open since 14 July and on the wave-one
   blocker list, is closed. Two descriptions rather than one: a spoken
   opener and a written invitation. The mechanism at the centre changed
   from a name on a profile to shared liability — if a member breaks the
   rules, the member who vouched for them goes too.

   Pitch cards v2 rebuild all twelve angle lines on that mechanism, drop
   "sponsor", and retire the Raya variant. The PDF generator was updated
   and re-run rather than the PDF rebuilt by hand.

   Craigslist is now recorded as the comparison others make, never the
   self-description — established from what Radio H-P and Gens de
   Confiance actually say about themselves.

   Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

4. Push to `main`.

5. Report back: the commit SHA, the exact file count, and anything you found that was not on the list above.

One thing to flag if you touch the trust code later, but NOT to fix now: the pitch commits us to "if you break the rules, you're both out" and the product has no rule for what happens to the people a removed member vouched for. It is logged as a wave-one blocker in tasks.md and needs deciding before the first invitation on 7 September. Do not implement it off the back of this commit.
```

---

## Why this is scoped so tightly

The 31 August session found a parallel Cowork session had written files mid-run and they were only swept into the docs commit once they had stopped changing. Same discipline here: an explicit file list, no `git add -A`, and a stop-and-ask rule for anything that turns up outside `COMPANY/` and `WORK AREAS/`.
