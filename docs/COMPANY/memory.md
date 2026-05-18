# Manhattanite — Memory

The Manhattanite-specific memory file. Read this at the start of every Manhattanite conversation.

Two parts:

1. **Quick state** below: what's true right now, in plain language.
2. **Deeper files** in `memory/`: `decisions.md` (every decision, dated) and `session-log.md` (chronological session history).

If something below conflicts with what you read in the deeper files, the deeper files win — and update this snapshot.

---

## Quick state — as of 2026-05-16

### What Manhattanite is

A private NYC marketplace. **Trust is the product, not coolness.** Built for New Yorkers who are sick of Craigslist and Facebook Marketplace.

Loose model: **Gens de Confiance, but for Manhattan.** Positioning is "invite-worthy because useful" — utility-first, with an aesthetic execution. The product *does* useful things; it just *looks* like a Soho House email. Pure status-positioning is explicitly rejected.

### The two-tier access model (core mechanic)

- **Tier 1 — Account.** Anyone with an email. Free, no review. Can view all listings and apply for membership. Cannot post, contact, or sponsor.
- **Tier 2 — Member.** Application + manual review + approval. Sponsored by an existing member (during seed phase, the sponsor is George by default). Sponsor is publicly named on the profile. Can post, contact, sponsor.

Wall between Tier 1 and Tier 2 is the trust gate. Account holders see the value. Members capture it.

### MVP scope

- **Categories at launch:** Apartments + Furniture. Jobs in v2.
- **Timeline:** ~14 weeks from 2026-05-16. Target ready by end of August 2026.
- **Intent:** Show-able working product populated with clearly-labeled example listings. Real account creation + application flow from day one. **Not** a public launch.
- **Stack (confirmed):** Next.js + Vercel + Supabase + Resend + Cloudflare + Plausible + Sentry + GitHub. Stripe in v2. Auth via magic link. RLS on every member-only table. ~$10/month all-in at MVP.
- **Member contact:** Contact form on each listing forwards to email. No in-product inbox until v2.
- **Out of v1:** In-platform messaging, jobs, search filters, payments, native apps, sponsorship request flow.

### Build environment (as of 2026-05-17, post-reconciliation)

- **Build repo:** **~/Developer/manhattanite** on George's Mac. This is the *existing* project (originally scaffolded 2026-04-26) with working code: Next.js 16 landing page + form + Resend email pipeline + Airtable integration. It will be migrated forward to become the MVP build, with COMPANY/ docs added under docs/.
- **GitHub:** github.com/georgegardner97/manhattanite (private). Was deleted and recreated empty on 2026-05-17; needs the Developer/manhattanite history force-pushed to it.
- **Build tool:** **Claude Code via the desktop app's Code tab.**
- **Worktree mode:** OFF (simpler for a non-technical user).
- **Working folder for Code sessions:** ~/Developer/manhattanite, branch `main`, mode `Local`.
- **Hosting:** Vercel project `manhattanite`, manhattanite.com is the primary URL, www.manhattanite.com 308-redirects to non-www.
- **Email DNS:** Resend already verified for manhattanite.com from prior setup.
- **Application review tool:** Airtable (existing base, retained during seed phase as George's manual review queue). Sunset planned for v1.5 or v2 once the in-product admin UI exists.
- **Cowork workspace** (the folder with this file) stays on ~/Desktop/Manhattanite for strategic + planning work. Drift between this folder's COMPANY/ and the build repo's docs/COMPANY/ is a known issue, managed manually until it becomes annoying.
- **Archived:** ~/Projects/manhattanite is being deleted/archived — it was a clean scratch space from 2026-05-17 setup work that is now redundant.

### Voice + brand

- **Voice anchor:** Soho House. Tagline placeholder: *New York's trusted private marketplace.*
- **Spelling:** American throughout product and marketing copy. (Manhattanite is a New York brand.)
- **Visual references:** Mr. Porter, Soho House, Raya, Casa Magazines, Le Labo, The New Yorker.
- **Wordmark + final palette:** deferred until we can see them on a real page. Black + cream is the working base, brick reserved.

### Personal Assistant rules

- **Outlook** = Manhattanite work. **Gmail** = personal. Never cross.
- Claude can draft, label, summarize without asking. Claude must never send without asking.

### Folder layout

- `ABOUT ME/` — read-only founder identity.
- `COMPANY/` — all Manhattanite business reference (this folder).
- `COMPANY/memory/` — the deep memory files.
- `WORK AREAS/` — active project work (none built yet).

---

## How to use the deeper files

| If you need… | Open… |
|---|---|
| Every decision we've made, dated | `memory/decisions.md` |
| Full chronological session-by-session history | `memory/session-log.md` |
| Why we're building this | `product-vision.md` |
| What we're building | `mvp-spec.md` |
| How it sounds | `voice-and-copy.md` |
| How it looks | `brand-guide.md` |
| How it's built | `tech-architecture.md` |
| How Claude operates day-to-day | `pa-rules.md` |

---

## Memory protocol

**Start of every Manhattanite conversation:**
1. Read `_index.md` (orientation)
2. Read this file (`memory.md`) for current state
3. Open `memory/decisions.md` only if you need a specific decision's full text
4. Open `memory/session-log.md` only if recent session context matters

**End of every meaningful session:**
1. Append a dated entry to `memory/session-log.md`
2. If a strategic decision was made or revised, update `memory/decisions.md`
3. Update the "Quick state" section above if anything material changed

---

*Last updated: 2026-05-16.*
