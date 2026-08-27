// /search — retired, 2026-08-27. Redirects to Browse, carrying the query.
//
// This was screen 04: its own route, its own GET form, filter chips, result
// rows. It was also the same read as Browse — same parseQuery, same buildHref,
// same gated rows, same filters — differing only in presentation, and NOTHING
// IN THE PRODUCT EVER LINKED TO IT. The only way in was to type the URL.
//
// So the search box moved onto Browse rather than search getting a nav slot
// (George, 2026-08-27), and this route became a redirect rather than a 404:
// links may exist, it was public, and the destination understands every
// parameter it was ever sent. Its ROWS did not come across — Browse keeps its
// card grid; ClListingRow is left in the tree for the archived-row comment
// that references it, and retires with the rest of the (ed) work in Slice 3b.
//
// A 308 rather than a 307: this is permanent, so a crawler that saw /search
// should stop asking. Nothing here reads the session or the database, and
// nothing may — a redirect that authenticates is a redirect that leaks timing.

import { permanentRedirect } from "next/navigation";
import { BROWSE_PATH } from "@/lib/cl/filters";

export default async function RetiredSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams; // Next 16: searchParams is async.

  // Forwarded verbatim rather than parsed and rebuilt. Browse parses and
  // validates every one of these itself, so re-deriving them here would be a
  // second implementation of parseQuery that could drift from the first.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      params.append(key, v);
    }
  }

  const qs = params.toString();
  permanentRedirect(qs ? `${BROWSE_PATH}?${qs}` : BROWSE_PATH);
}
