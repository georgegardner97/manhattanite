// Screen 08 — Member profile, in the Classifieds system.
//
// ---------------------------------------------------------------------------
// 2026-08-31. THIS PAGE USED TO 404 ON MOST MEMBERS, and the shape of the bug
// is worth keeping written down.
//
// It was built entirely from listings, deliberately: `accounts` is read-own
// under RLS (0001), so the only public facts about another member were the
// denormalized byline that migration 0006 put on every listing — `author_name`
// and `sponsor_names`, already printed on every card. Elegant, and it showed no
// fact that was not already out loud. But it meant a member with no PUBLISHED
// listing had no name this page could read, and the page answered notFound().
//
// That is most new members. You are vouched in, your name appears in the
// vouching list of the person who brought you in, and the link goes nowhere.
// George hit it clicking through to Emma Kanne from his own vouching list.
// A profile cannot be a by-product of having posted something — being a member
// is the qualification, and the page now says so.
//
// So the identity half comes from get_member_profile() (0026): name, photo,
// neighborhood, bio, LinkedIn, member since, and the sponsors, which come from
// `sponsorships` rather than from listing bylines for exactly the same reason.
// The listings half is unchanged and may legitimately be empty.
//
// EACH VOUCHER NAME IS A LINK TO THAT MEMBER PROFILE (George, 2026-08-31):
// "you are able to see who vouched for them by name, and equally are able to
// click through to that person profile too". Seeing the name has worked since
// 0026; the click-through could not, because 0026 returned the vouchers as
// NAMES ONLY and a name is not an address — /members/[id] is keyed on the
// account id. Migration 0030 adds sponsor_ids, paired BY INDEX with
// sponsor_names, and a voucher with an id renders as a link. A voucher without
// one renders as plain text, which is what the byline fallback below always
// yields and what every name does until 0030 is run.
//
// notFound() now means ONE thing — this id is not an approved member — which is
// what a 404 should mean. 0026 returns no row for a Tier 1 account or a
// stranger, so non-members still have no public face.
//
// IT DEGRADES RATHER THAN BREAKS IF 0026 IS NOT APPLIED YET. Migrations here
// are hand-run in the SQL editor, so code can land first; if the function is
// missing the page falls back to the old listings-derived name and the old
// 404. Once George runs 0026 it simply starts working. See `profile` below.
// ---------------------------------------------------------------------------
//
// WHAT THE DESIGN HAS THAT THIS STILL DOESN'T:
//
//   "Members vouched: 4" → counting someone else's sponsees is a separate
//   privacy decision and the most socially loaded number on the screen. 0026
//   deliberately does not return it. Omitted rather than approximated.
//
//   "Usually replies: same day" → nothing measures reply time. listing_contacts
//   records that a message was sent, never that one came back.
//
// ---------------------------------------------------------------------------
// MEMBERS ONLY TO A LOGGED-OUT VISITOR, AS OF 2026-08-26. The founder rule is
// that a guest sees no member name and no sponsor name anywhere; everywhere
// else that is a byline that changes wording, but this whole page IS a named
// member — the name is the headline, the sponsors are the subtitle, and the
// grid is "their listings". Anonymized it says nothing at all. So a guest gets
// the wall instead, and the refusal happens BEFORE anything is read: no name is
// ever loaded into a page a guest is looking at.
//
// Two consequences worth having. Nothing in the Classifieds system links a
// guest here — the lister name on /listings/[id] is unlinked text for them. And
// the page stops being indexable by doing nothing special: a crawler is a
// logged-out visitor, and it gets the wall.
// ---------------------------------------------------------------------------

import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signImagePaths } from "@/lib/storage/sign-image-urls";
import { formatPrice, placeOf } from "@/lib/listings/card";
import AppHeader from "@/app/components/cl/AppHeader";
import ClGate from "@/app/components/cl/ClGate";
import ClListingCard, {
  EAGER_CARDS,
  type ClCard,
} from "@/app/components/cl/ClListingCard";
import { readMemberListings } from "@/lib/cl/listings-read";
import { relativeDay } from "@/lib/cl/filters";

export const dynamic = "force-dynamic"; // session state varies per request.

/** The row shape of get_member_profile() — 0026, plus sponsor_ids from 0030. */
type MemberProfile = {
  name: string | null;
  avatar_path: string | null;
  neighborhood: string | null;
  bio: string | null;
  linkedin_url: string | null;
  member_since: string | null;
  sponsor_names: string[] | null;
  /** 0030. Absent until it is run, which is why every read of it is optional. */
  sponsor_ids?: string[] | null;
};

/**
 * A LinkedIn field is free text a member typed, and this page shows it to other
 * members, so it is only ever rendered as a link when it really points at
 * LinkedIn. Anything else stays inert text: a profile field is not a place to
 * hand someone an arbitrary outbound link on our say-so. The stored value has
 * no scheme normalization (the placeholder is "linkedin.com/in/you"), so the
 * scheme is added here rather than assumed.
 */
function linkedinHref(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default async function ClassifiedsMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The wall, before the read. See the note at the top.
  if (!user) {
    return (
      <>
        <AppHeader active="none" />
        <main className="mx-auto w-full max-w-[1000px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(40px,6vw,80px)] pb-[clamp(32px,4vw,56px)]">
          <ClGate
            title="Members only"
            note="Who someone is, and who vouched for them, is for people inside the network. Sign in, or request access."
          />
        </main>
      </>
    );
  }

  // Identity and listings are independent reads now: a member with nothing
  // posted still has a profile, and a profile that returns nothing is not a
  // member. `error` is swallowed on purpose — see the degradation note above.
  const [{ data: profileRows, error: profileError }, { rows }] =
    await Promise.all([
      supabase.rpc("get_member_profile", { target: id }),
      readMemberListings(id),
    ]);

  const profile = (profileRows as MemberProfile[] | null)?.[0] ?? null;

  // Not an approved member — and, while 0026 is unapplied, the old rule of "no
  // visible listings, nothing to describe" still stands in for it.
  if (!profile && (profileError ? rows.length === 0 : true)) notFound();

  const name =
    profile?.name ?? rows.find((r) => r.author_name)?.author_name ?? "A member";

  // Vouchers from `sponsorships` when 0026 is live, because that is the whole
  // point of the page and it must not depend on having posted. The union across
  // listing bylines is the fallback: the cache is per-listing and can differ
  // between rows if sponsors were added over time, so the union is the fullest
  // true answer available from that source.
  //
  // THE ID IS WHAT MAKES THE NAME A LINK, and only the first path carries one.
  // 0030 returns sponsor_ids paired by index with sponsor_names; `?.[i] ?? null`
  // is deliberate rather than an index into an assumed-parallel array, so a
  // missing 0030, a shorter array or a null entry all degrade to plain text
  // instead of building a link to `/members/undefined`.
  const vouchers: { name: string; id: string | null }[] =
    profile?.sponsor_names && profile.sponsor_names.length > 0
      ? profile.sponsor_names.map((n, i) => ({
          name: n,
          id: profile.sponsor_ids?.[i] ?? null,
        }))
      : [...new Set(rows.flatMap((r) => r.sponsor_names ?? []))].map((n) => ({
          name: n,
          id: null,
        }));

  // Public bucket → a plain URL, no signing. Same path as /profile.
  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data
        .publicUrl
    : null;

  const linkedin = linkedinHref(profile?.linkedin_url ?? null);
  const memberSince = profile?.member_since
    ? String(new Date(profile.member_since).getFullYear())
    : null;

  const coverUrlByPath = await signImagePaths(
    rows.map((r) => r.images?.[0]?.path).filter((p): p is string => Boolean(p))
  );

  const cards: ClCard[] = rows.map((row) => {
    const coverPath = row.images?.[0]?.path;
    return {
      id: row.id,
      title: row.title,
      place: placeOf(row),
      price: formatPrice(row.price_cents, row.type),
      // The byline is redundant on someone's own profile — every card here has
      // the same author — so the meta line carries the date alone. Empty
      // `meta` is the card's signal for that: it renders the date with no
      // leading separator.
      meta: "",
      when: relativeDay(row.created_at),
      coverUrl: coverPath ? coverUrlByPath.get(coverPath) ?? null : null,
      isExample: row.is_example,
    };
  });

  // The member's own neighborhood is the honest source now. Falling back to a
  // neighborhood scraped off their listings would describe where they sell
  // things, not where they live.
  const neighborhood =
    profile?.neighborhood?.trim() ||
    rows
      .map((r) => r.details?.neighborhood)
      .find((v): v is string => typeof v === "string" && v.trim() !== "") ||
    null;

  return (
    <>
      <AppHeader active="none" />

      <main className="mx-auto w-full max-w-[1000px] px-[clamp(16px,2.4vw,28px)] pt-[clamp(26px,3vw,44px)] pb-[clamp(32px,4vw,56px)]">
        <div className="flex flex-wrap items-center gap-[22px]">
          {/* The design photograph, with .cl-avatar as the placeholder behind
              it — see the note on it in classifieds.css. */}
          <div className="cl-avatar h-[76px] w-[76px] overflow-hidden">
            {avatarUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="min-w-[200px] flex-1">
            <h1 className="text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.02em]">
              {name}
            </h1>
            <p
              className="mt-[7px] text-[13.5px]"
              style={{ color: "var(--cl-muted)" }}
            >
              {neighborhood}
              {neighborhood && vouchers.length > 0 && " · "}
              {vouchers.length > 0 && (
                <>
                  {"Vouched for by "}
                  {/* Every voucher is named. This used to slice(0, 2), which
                      quietly disagreed with the "Vouched for by" stat below —
                      three vouchers read as two names above the number 3 — and
                      it contradicts the ask, which is to see who vouched for
                      someone by name. Serial commas, "&" before the last. */}
                  {vouchers.map((v, i) => (
                    <Fragment key={v.id ?? v.name}>
                      {i > 0 && (i === vouchers.length - 1 ? " & " : ", ")}
                      {v.id ? (
                        <Link
                          href={`/members/${v.id}`}
                          className="underline underline-offset-2"
                        >
                          {v.name}
                        </Link>
                      ) : (
                        v.name
                      )}
                    </Fragment>
                  ))}
                </>
              )}
            </p>
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-[6px] inline-block text-[13.5px] underline underline-offset-2"
                style={{ color: "var(--cl-muted)" }}
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>

        {profile?.bio?.trim() && (
          <p className="mt-6 max-w-[620px] text-[14.5px] leading-[1.6] whitespace-pre-line">
            {profile.bio.trim()}
          </p>
        )}

        {/* Three cells when we know when they joined, two when we do not. The
            design's third — "usually replies" — still has nothing behind it. */}
        <div
          className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] overflow-hidden rounded-[12px] border"
          style={{ borderColor: "var(--cl-hairline)" }}
        >
          {/* Everything they have published, capped at 24 — which is the true
              count for anyone who can reach this page now that a guest cannot. */}
          <Stat label="Listings" value={String(rows.length)} />
          <Stat label="Vouched for by" value={String(vouchers.length)} divided />
          {memberSince && (
            <Stat label="Member since" value={memberSince} divided />
          )}
        </div>

        <div className="cl-grouplabel mt-[34px] mb-4">Their listings</div>
        {cards.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[26px]">
            {cards.map((card, i) => (
              <ClListingCard key={card.id} card={card} eager={i < EAGER_CARDS} />
            ))}
          </div>
        ) : (
          /* The case that used to be a 404. Say it plainly rather than showing
             an empty grid, which reads as a page that failed to load. */
          <p className="text-[14px]" style={{ color: "var(--cl-muted)" }}>
            Nothing posted yet.
          </p>
        )}
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  divided,
}: {
  label: string;
  value: string;
  divided?: boolean;
}) {
  return (
    <div
      className="px-5 py-[18px]"
      style={divided ? { borderLeft: "1px solid var(--cl-hairline)" } : undefined}
    >
      <div
        className="text-[11.5px] uppercase"
        style={{ letterSpacing: "0.1em", color: "var(--cl-faint)" }}
      >
        {label}
      </div>
      <div className="mt-2 text-[20px] font-medium tabular-nums">{value}</div>
    </div>
  );
}
