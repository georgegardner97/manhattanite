// Wordmark — the single source of truth for how Manhattanite signs its name.
//
// The locked mark (Concept D, wordmark round 2, 2026-07-21): "Manhattanite." —
// Instrument Serif roman, italic "ite", closed by a roman period. The period is
// PART of the mark: never dropped, never italic (it follows the roman). "ite"
// is always italic. This component replaces every hand-rolled
// `Manhattan<span className="italic">ite</span>` across the app so the mark can
// never drift from one surface to the next.
//
// Size and color come from the caller via `className` (or by inheriting color
// from a wrapping <Link>, which is how the nav's hover-to-bone works). The
// structure — the letters, the italic, the period, the serif family — is fixed
// here and nowhere else.
//
// Scope guard: the period belongs to the WORDMARK only — the logo. Running text
// that mentions Manhattanite (terms, descriptions, meta descriptions) does NOT
// gain a period and does NOT use this component; it stays plain prose.

import type { ElementType } from "react";

export default function Wordmark({
  as: Tag = "span",
  className = "",
}: {
  /** Element to render as. A `span` by default; callers that need it clickable
      wrap it in their own <Link>. Pass `as="div"` for block contexts (footer). */
  as?: ElementType;
  className?: string;
}) {
  return (
    // `whitespace-nowrap` guarantees the period never wraps to its own line, and
    // keeps "Manhattanite." intact if a caller ever sets it in a narrow column.
    <Tag className={`font-serif whitespace-nowrap ${className}`}>
      Manhattan<span className="italic">ite</span>.
    </Tag>
  );
}
