// The one gated listings read the Classifieds preview screens share.
//
// Browse (02), Search (04) and Saved (06) all want "the listings this viewer is
// allowed to see". Written three times that is three chances to get the teaser
// cap wrong, and the cap IS the trust gate — a guest may see the six most
// recent published listings and nothing else. So it is written once, here, and
// the screens differ only in how they present what comes back.
//
// The rules are the live /listings rules, unchanged:
//
//   - Published rows only.
//   - Guests get the 6-row teaser. Anonymous read of published rows is
//     permitted at the data layer (migration 0010); the cap is enforced in the
//     query, exactly as it is on /listings, because viewing is the funnel and
//     the action layer is the gate.
//   - Signed-in accounts and members get the full feed, capped at 50.
//   - A GUEST IS SHOWN NO NAMES. The byline on a card is assembled here too
//     (cardMeta), and for a logged-out reader it names neither the lister nor
//     the sponsor. Same reasoning as the cap: the data layer will hand the
//     names over, so the rule has to hold in the one place every screen reads.
//
// Every screen then filters, sorts and counts IN MEMORY over this one result
// set. At a 50-row ceiling that is one round-trip instead of several, and it
// makes it impossible for a filter, a search term or a saved id to widen what
// the viewer is allowed to see: there is only ever the one gated read.

import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { renderByline } from "@/lib/listings/byline";
import {
  formatPrice,
  neighborhoodOf,
  placeOf,
  type ListingRow,
  type ListingType,
} from "@/lib/listings/card";
import { relativeDay } from "@/lib/cl/filters";
import type { ClCard } from "@/app/components/cl/ClListingCard";

/** The four states a listing moves through. Shared so the page, the actions
 *  and the reader all agree on the vocabulary. */
export type ListingStatus = "pending" | "published" | "draft" | "archived";

export type BrowseRow = ListingRow & {
  // author_id is selected so readMemberListings() can narrow the permitted set
  // by author in memory, rather than running a second, ungated query.
  author_id: string;
  author_name: string | null;
  sponsor_names: string[];
};

export const TEASER_LIMIT = 6;
export const FEED_LIMIT = 50;
/** A signed-in viewer's ceiling on one member's profile. */
export const MEMBER_LIMIT = 24;

export type GatedListings = {
  rows: BrowseRow[];
  isGuest: boolean;
};

/** Who is looking. The only thing a card needs to know about a reader, and the
 *  one fact that decides whether anyone is named on it. `GatedListings` already
 *  answers it, so a gated read can be passed straight through. */
export type Viewer = { isGuest: boolean };

export async function readPermittedListings(): Promise<GatedListings> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isGuest = !user;

  const { data } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, created_at, images, details, is_example, author_id, author_name, sponsor_names"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(isGuest ? TEASER_LIMIT : FEED_LIMIT)
    .returns<BrowseRow[]>();

  return { rows: data ?? [], isGuest };
}

/**
 * One member's published listings, through the same gate.
 *
 * ADDED 2026-08-18, DURING THE MIGRATION, BECAUSE PROMOTING THE PROFILE BROKE
 * THE CAP. The member page used to run its own `.eq("author_id", …).limit(24)`
 * read. Migration 0010 permits anonymous SELECT on published rows at the data
 * layer — the six-row teaser is an APPLICATION cap, enforced in the query above
 * — so that second read handed a logged-out visitor up to 24 of a member's
 * listings, including ones the teaser hides. Clicking one then showed the
 * members-only wall, which is the tell: the grid was offering rows the detail
 * page refuses. Walking the member links was a way around the trust gate.
 *
 * It only mattered once the page became public. At /design/members/[id] it was
 * a noindex preview; at /members/[id] it is a crawlable route, so the fix lands
 * with the promotion rather than after it.
 *
 * A guest therefore sees only this member's rows that are ALREADY in their
 * teaser six — never a row they could not reach from browse. A signed-in viewer
 * reads the member directly, capped at 24, which is the behavior as built.
 *
 * SINCE 2026-08-26 /members/[id] shows a guest the members-only wall instead of
 * calling this at all, so the guest branch below is no longer reached from that
 * page. It stays: it is this module's guarantee about what a guest may be shown,
 * and the next screen to read a member's listings may not have a wall in front
 * of it.
 */
export async function readMemberListings(
  authorId: string
): Promise<GatedListings> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The guest path deliberately does not query by author at all: it takes the
  // permitted set and narrows it. There is no way for an author id to widen it.
  if (!user) {
    const { rows } = await readPermittedListings();
    return {
      rows: rows.filter((row) => row.author_id === authorId),
      isGuest: true,
    };
  }

  const { data } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, created_at, images, details, is_example, author_id, author_name, sponsor_names"
    )
    .eq("author_id", authorId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(MEMBER_LIMIT)
    .returns<BrowseRow[]>();

  return { rows: data ?? [], isGuest: false };
}

/** A row on your own listings: the card columns plus what only that screen
 *  needs — the status and the moderator's note. */
export type OwnRow = BrowseRow & {
  status: ListingStatus;
  moderation_note: string | null;
};

/**
 * Your own listings, every status, newest first.
 *
 * ADDED 2026-08-26 (Slice 2) RATHER THAN INLINED ON THE PAGE, which is the whole
 * point. /members/[id] shipped a trust hole in Slice 1 by writing its own
 * listings query and never applying the teaser cap, and the RLS audit passed
 * 59/59 either side of it because the hole was above the database. The rule that
 * came out of it: a screen that lists listings calls a reader in this module, or
 * it is wrong. This screen needed a narrowing no existing helper covered — own
 * rows at ANY status — so the narrowing is written here instead of on the page.
 *
 * There is no teaser question to get wrong: the author_id filter plus
 * listings_read_own (0016) return exactly the caller's own rows, and the policy
 * is keyed on auth.uid(), so passing someone else's id returns nothing. The cap
 * that guards the public feed has nothing to guard here — but the read still
 * lives beside it, so the next person looking for "how do I read listings" finds
 * every answer in one file.
 */
export async function readOwnListings(): Promise<OwnRow[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session, no own listings. The page redirects before this, so this is
  // the belt to that braces.
  if (!user) return [];

  const { data } = await supabase
    .from("listings")
    .select(
      "id, type, title, description, price_cents, created_at, images, details, is_example, author_id, author_name, sponsor_names, status, moderation_note"
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .returns<OwnRow[]>();

  return data ?? [];
}

/**
 * Per-type counts across every row the viewer may see, so the rail's numbers
 * stay put as the neighborhood and price filters move.
 *
 * Guests get `null` rather than numbers: with only the six teaser rows in hand,
 * "Apartments 2" would be a number about the teaser presented as a number about
 * the network.
 */
export function countByType(
  { rows, isGuest }: GatedListings
): Record<ListingType, number> | null {
  if (isGuest) return null;
  return rows.reduce(
    (acc, row) => {
      acc[row.type] = (acc[row.type] ?? 0) + 1;
      return acc;
    },
    { apartment: 0, furniture: 0, service: 0, other: 0 } as Record<
      ListingType,
      number
    >
  );
}

/**
 * The neighborhoods actually present, so a rail can never offer a dead filter.
 *
 * The CALLER decides which rows to pass. Browse passes apartments only, because
 * the neighborhood filter applies to apartments only (see hoodApplies in
 * filters.ts) — a list derived from every row would offer neighborhoods that
 * only a chair is in.
 */
export function neighborhoodsIn(rows: BrowseRow[]): string[] {
  return [
    ...new Set(
      rows
        .map(neighborhoodOf)
        .filter((v): v is string => v !== null)
    ),
  ].sort((a, b) => a.localeCompare(b));
}

/**
 * The meta line under a card — AND THE ONE PLACE A MEMBER'S NAME IS DECIDED.
 *
 * THE RULE (founder, 2026-08-26): a logged-out visitor sees no member name and
 * no sponsor name, anywhere. Signed in — account or member — nothing changes:
 * the full byline is exactly what it always was, and the vouching mechanic is
 * intact for everyone actually in the building.
 *
 * It settles the tension the landing page had been carrying in a comment since
 * 18 August. The landing anonymized; browse, search, saved and the member
 * profile named the same visitor one click away. Browse changed to match the
 * landing, not the other way round.
 *
 * WHY IT LIVES HERE AND NOT IN AN RLS POLICY. `author_name` and `sponsor_names`
 * are denormalized onto every listing (0006) and published rows are anonymously
 * readable (0010). The database will keep handing the names over, and that is
 * correct — the byline is public data to a signed-in reader, and this is a
 * presentation rule about one audience. So, like the six-row teaser cap, it is
 * an APPLICATION rule.
 *
 * Which makes it exactly the class of bug that produced Slice 1's trust hole:
 * `audit:rls` passes 59/59 whether this is right or wrong. The assertions that
 * actually hold it are in scripts/audit-gates.ts — every guest-reachable route
 * is fetched and its body checked for real member names.
 *
 * It is one function rather than a flag threaded through five pages: the two
 * bylines are written once, here, and `toClCards` is the only caller. The
 * landing used to carry its own `anonymousMeta()`; this is that function, moved
 * to where every screen already reads.
 */
export function cardMeta(row: BrowseRow, isGuest: boolean): string {
  const when = relativeDay(row.created_at);

  if (isGuest) {
    // "Vouched by a member · 4 days ago" — the trust fact, no name attached.
    // Nobody has sponsored it yet, so there is no vouching to claim: saying so
    // plainly beats implying a sponsor that does not exist.
    const who =
      row.sponsor_names.length > 0
        ? "Vouched by a member"
        : "Listed by a member";
    return `${who} · ${when}`;
  }

  // renderByline stays the single source of truth for how sponsors are named
  // (the hybrid-at-2 rule); this system only adds the date.
  return `${renderByline(row.author_name, row.sponsor_names)} · ${when}`;
}

/**
 * Rows → cards, signing every cover in one round-trip.
 *
 * Sign LAST, over the rows that survived filtering, rather than over everything
 * read: a signed URL is a grant, and there is no reason to mint fifty of them
 * to render six cards.
 *
 * `viewer` IS REQUIRED, AND THAT IS THE POINT. It used to be an optional
 * `renderMeta` override, which meant a screen got the named byline by saying
 * nothing — the failure mode that let the landing and browse disagree about how
 * public a member's name is. Now every screen has to state who is looking, and
 * a new one will not compile until it does. `GatedListings` satisfies the shape,
 * so the usual call is `toClCards(visible, gated)`: these rows, for this read.
 */
export async function toClCards(
  rows: BrowseRow[],
  viewer: Viewer
): Promise<ClCard[]> {
  const coverUrlByPath = await signImagePaths(
    rows
      .map((row) => row.images?.[0]?.path)
      .filter((p): p is string => Boolean(p))
  );

  return rows.map((row) => {
    const coverPath = row.images?.[0]?.path;
    return {
      id: row.id,
      title: row.title,
      place: placeOf(row),
      price: formatPrice(row.price_cents, row.type),
      meta: cardMeta(row, viewer.isGuest),
      coverUrl: coverPath ? coverUrlByPath.get(coverPath) ?? null : null,
      isExample: row.is_example,
    };
  });
}
