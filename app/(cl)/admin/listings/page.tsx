// /admin/listings — every listing, every status. NEW in Slice 3b.
//
// THIS IS THE POINT OF THE SLICE, not the redesign. Before it, admin had no
// handle on a listing once it went live: the three 0017 verbs act on the review
// QUEUE, which is status='pending' only, and RLS on listings is owner-only for
// writes. A phone number in public, or a phrase that trips fair housing, needed
// a hand-written SQL statement to remove.
//
// NO MIGRATION FOR THE LIST ITSELF. listings_admin_read_all (0015) already
// returns every row at every status to an admin, so this page is a plain read.
// 0028 is needed only for the two WRITE paths the rows offer.
//
// IT IS NOT THE REVIEW QUEUE, AND THE TWO MUST NOT BLUR. /admin/moderation is a
// decision surface: things waiting on you, oldest first, shown in full so you
// can judge them. This is a directory: everything that exists, scannable,
// filterable, one row deep. The intro line on each screen says which is which,
// because "listings" appearing twice in one nav is otherwise a coin toss.
//
// FILTERS ARE URL-DRIVEN (?status=&type=&q=), the same as browse — shareable,
// back-buttonable, and working with JavaScript off. Filtering is done in memory
// over the already-read rows rather than in the query: the network is small,
// and one read that every filter narrows is easier to reason about than five
// query shapes.
//
// ARCHIVED ROWS STAY LISTED and are visibly archived. Nothing is hard-deleted —
// soft-delete-only is locked (0014), and a directory that hides what it took
// down is a directory you cannot audit.

import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import ClAdminShell from "@/app/components/cl/ClAdminShell";
import ClAdminListingRow from "@/app/components/cl/ClAdminListingRow";

export const dynamic = "force-dynamic"; // session state varies per request.

type AdminListing = {
  id: string;
  type: "apartment" | "furniture" | "other" | "service";
  title: string;
  price_cents: number | null;
  status: "draft" | "pending" | "published" | "archived";
  author_id: string;
  author_name: string | null;
  created_at: string;
  corrected_at: string | null;
  outcome: string | null;
};

const STATUSES = ["published", "pending", "draft", "archived"] as const;
const TYPES = ["apartment", "furniture", "service", "other"] as const;

const STATUS_LABEL: Record<string, string> = {
  draft: "Returned",
  pending: "In review",
  published: "Live",
  archived: "Archived",
};

const TYPE_LABEL: Record<string, string> = {
  apartment: "Apartment",
  furniture: "Furniture",
  service: "Service",
  other: "Everything else",
};

// Why a member took their own listing down (0031). Read as data, not rendered
// as a chip: this is a fact George is reading, not a status a member is being
// judged by. found_here and found_elsewhere stay separate words on purpose —
// see the migration header for why merging them would flatter the number.
const OUTCOME_LABEL: Record<string, string> = {
  found_here: "found its person here",
  found_elsewhere: "sorted elsewhere",
  withdrawn: "withdrawn",
  no_luck: "no luck",
};

// A null renders as NOTHING, never "Unknown": the three populations that
// produce one (archived before 0031, taken down by an admin, withdrawn while
// still pending) are not the same thing, and one word for all three would
// invent a fourth.
function outcomeLabel(outcome: string | null): string | null {
  if (outcome === null) return null;
  return OUTCOME_LABEL[outcome] ?? outcome;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// The admin table is the SECOND place that says "No price" out loud, for the
// same reason /admin/moderation does: a moderator has to tell a deliberate
// blank from a broken row, and silence reads as broken. Everywhere a member or
// a visitor looks, no price still means no line at all (0027).
function formatPrice(cents: number | null, type: string): string {
  if (cents === null) return "No price";
  const dollars = Math.round(cents / 100).toLocaleString("en-US");
  return type === "apartment" ? `$${dollars}/mo` : `$${dollars}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams; // Next 16: searchParams is async.

  const rawStatus = first(sp.status);
  const rawType = first(sp.type);
  const status = STATUSES.includes(rawStatus as never) ? rawStatus! : null;
  const type = TYPES.includes(rawType as never) ? rawType! : null;
  const q = (first(sp.q) ?? "").trim().slice(0, 80);

  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, type, title, price_cents, status, author_id, author_name, created_at, corrected_at, outcome"
    )
    .order("created_at", { ascending: false })
    .returns<AdminListing[]>();

  // A FAILED READ MUST NOT RENDER AS AN EMPTY NETWORK. `data ?? []` on its own
  // turns any query error into a confident "0 listings", which on THIS screen
  // is the worst possible lie: it is the page you check to find out what is on
  // the site. Caught during Slice 3b, when the page was pointed at prod before
  // 0028 had been applied and the missing `corrected_at` column produced a
  // clean, empty, entirely wrong table.
  if (error) {
    return (
      <ClAdminShell
        active="listings"
        title="All listings"
        intro="The listings could not be read."
      >
        <p className="max-w-[62ch] text-[14px] leading-[1.6]">
          {error.message}
        </p>
        <p
          className="mt-3 max-w-[62ch] text-[13px] leading-[1.6]"
          style={{ color: "var(--cl-muted)" }}
        >
          If this names a missing column, the migration that adds it has not
          been applied yet — <code>corrected_at</code> is{" "}
          <code>0028_admin_listing_edit.sql</code>, <code>outcome</code> is{" "}
          <code>0031_listing_outcome.sql</code>.
        </p>
      </ClAdminShell>
    );
  }

  const all = data ?? [];

  const term = q.toLowerCase();
  const rows = all.filter((row) => {
    if (status && row.status !== status) return false;
    if (type && row.type !== type) return false;
    if (term) {
      const hay = `${row.title} ${row.author_name ?? ""}`.toLowerCase();
      if (!term.split(/\s+/).filter(Boolean).every((w) => hay.includes(w))) {
        return false;
      }
    }
    return true;
  });

  const countOf = (s: string) => all.filter((r) => r.status === s).length;

  // Build a href with one facet changed, keeping the rest — same contract as
  // browse's buildHref, small enough not to be worth sharing.
  const href = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const next = { status, type, q, ...patch };
    if (next.status) params.set("status", String(next.status));
    if (next.type) params.set("type", String(next.type));
    if (next.q) params.set("q", String(next.q));
    const qs = params.toString();
    return qs ? `/admin/listings?${qs}` : "/admin/listings";
  };

  return (
    <ClAdminShell
      active="listings"
      title="All listings"
      intro="Everything on the network, at every status — including what has been taken down. This is the directory; the review queue is In review."
    >
      {/* A plain GET form, so a search has its own URL and needs no JavaScript.
          The hidden fields carry the facets the search did not touch. */}
      <form
        action="/admin/listings"
        method="get"
        className="mb-4 flex flex-wrap items-center gap-2.5"
      >
        {status && <input type="hidden" name="status" value={status} />}
        {type && <input type="hidden" name="type" value={type} />}
        <label htmlFor="admin-q" className="sr-only">
          Search listings by title or author
        </label>
        <input
          id="admin-q"
          name="q"
          type="search"
          defaultValue={q}
          maxLength={80}
          placeholder="Title or author"
          className="cl-input min-w-[220px] flex-1 text-[14px]"
          style={{ padding: "10px 13px", maxWidth: "340px" }}
        />
        <button type="submit" className="cl-pill" style={{ padding: "10px 18px" }}>
          Search
        </button>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
        <FacetGroup
          label="Status"
          current={status}
          all={`All ${all.length}`}
          allHref={href({ status: null })}
          options={STATUSES.map((s) => ({
            value: s,
            label: `${STATUS_LABEL[s]} ${countOf(s)}`,
            href: href({ status: s }),
          }))}
        />
        <FacetGroup
          label="Category"
          current={type}
          all="All"
          allHref={href({ type: null })}
          options={TYPES.map((t) => ({
            value: t,
            label: TYPE_LABEL[t],
            href: href({ type: t }),
          }))}
        />
      </div>

      <div
        className="border-b pb-3 text-[13px]"
        style={{ borderColor: "var(--cl-hairline)", color: "var(--cl-muted)" }}
      >
        {rows.length} {rows.length === 1 ? "listing" : "listings"}
        {q && ` matching “${q}”`}
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-[15px]" style={{ color: "var(--cl-muted)" }}>
          Nothing matches those filters.
        </p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li
              key={row.id}
              className="border-b py-4"
              style={{ borderColor: "var(--cl-hairline)" }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[15px]">{row.title}</span>
                    <StatusChip status={row.status} />
                    {row.corrected_at && (
                      <span
                        className="text-[12px]"
                        style={{ color: "var(--cl-faint)" }}
                        title={`Corrected ${formatDate(row.corrected_at)}`}
                      >
                        corrected
                      </span>
                    )}
                  </div>
                  <div
                    className="mt-1 text-[12.5px]"
                    style={{ color: "var(--cl-muted)" }}
                  >
                    {TYPE_LABEL[row.type]} · {row.author_name ?? "(no name)"} ·{" "}
                    {formatDate(row.created_at)}
                    {outcomeLabel(row.outcome) && ` · ${outcomeLabel(row.outcome)}`}
                  </div>
                </div>

                <div
                  className="whitespace-nowrap text-[14px]"
                  style={{
                    color:
                      row.price_cents === null
                        ? "var(--cl-faint)"
                        : "var(--cl-ink)",
                  }}
                >
                  {formatPrice(row.price_cents, row.type)}
                </div>
              </div>

              <ClAdminListingRow
                listingId={row.id}
                title={row.title}
                status={row.status}
                // Only a published listing has a public page to view.
                viewHref={row.status === "published" ? `/listings/${row.id}` : null}
              />
            </li>
          ))}
        </ul>
      )}
    </ClAdminShell>
  );
}

function StatusChip({ status }: { status: string }) {
  const live = status === "published";
  const gone = status === "archived";
  return (
    <span
      className="cl-chip cl-chip-xs"
      style={{
        color: gone ? "var(--cl-faint)" : live ? "var(--cl-ink)" : "var(--cl-muted)",
      }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function FacetGroup({
  label,
  current,
  all,
  allHref,
  options,
}: {
  label: string;
  current: string | null;
  all: string;
  allHref: string;
  options: { value: string; label: string; href: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="cl-grouplabel">{label}</span>
      <Link
        href={allHref}
        aria-current={current === null ? "page" : undefined}
        className="cl-chip"
        style={current === null ? { color: "var(--cl-ink)", fontWeight: 500 } : { color: "var(--cl-muted)" }}
      >
        {all}
      </Link>
      {options.map((o) => (
        <Link
          key={o.value}
          href={o.href}
          aria-current={current === o.value ? "page" : undefined}
          className="cl-chip"
          style={
            current === o.value
              ? { color: "var(--cl-ink)", fontWeight: 500 }
              : { color: "var(--cl-muted)" }
          }
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
