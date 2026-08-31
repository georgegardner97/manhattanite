// Shared listing byline — the single place the "Listed by … · vouched for by …"
// string is assembled. Both listing pages (browse + detail) import from here so
// the format lives in exactly one spot (Build Plan §4, Multi-Sponsor slice).
//
// The database stores facts: listings.sponsor_names is an ordered text[] —
// primary sponsor (the inviter) first, then the rest by when they were added.
// This module decides how to SHOW them: the hybrid-at-2 rule.
//
// Hybrid-at-2 (real names up to two, then a count):
//   0 sponsors → "Listed by Marcus"
//   1 sponsor  → "Listed by Marcus · vouched for by John R."
//   2 sponsors → "Listed by Marcus · vouched for by John R. & Sarah K."
//   3+ sponsors → "Listed by Marcus · vouched for by John R., Sarah K. + 1 more"
//
// THE WORD MEMBERS READ IS "VOUCHED", THE WORD THE CODE USES IS "SPONSOR"
// (George, 2026-08-31). "Sponsor" carries financial and recovery meanings he
// does not want on a trust product, and the product already said "vouch" in
// half its screens. The rename is DELIBERATELY COPY-ONLY: the columns
// (sponsor_names, sponsor_id), the sponsorships table, the RPCs and these
// identifiers all keep their names, because renaming a live schema to change
// a noun buys nothing and risks the byline every listing depends on.
//
// The threshold, punctuation, and pluralization all live here, so changing the
// rule later is a code edit, not a database re-run.

const SPONSOR_NAME_LIMIT = 2; // hybrid-at-2: show up to 2 names, then "+ N more"

export function renderByline(
  authorName: string | null,
  sponsorNames: string[] | null
): string {
  // Author always shown; "a member" is a defensive fallback if the denormalized
  // author_name is ever null (shouldn't happen post-migration 0006).
  const author = `Listed by ${authorName ?? "a member"}`;
  const names = sponsorNames ?? [];
  if (names.length === 0) return author;
  return `${author} · vouched for by ${formatSponsors(names)}`;
}

function formatSponsors(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  const shown = names.slice(0, SPONSOR_NAME_LIMIT).join(", ");
  return `${shown} + ${names.length - SPONSOR_NAME_LIMIT} more`;
}
