// MetaRows — hairline-separated label/value pairs.
//
// Design foundation, Slice 2 (listing detail) promoted to a component in
// Slice 3, when /profile needed the identical thing. A small-caps label in a
// fixed 180px column, the value beside it, a hairline above every row and
// below the last. Under 860px the columns stack.
//
// items-baseline, not the default stretch: the 11px label and the 15px value
// have to sit on the same line, or the caps ride visibly high against the
// value beside them.

import type { ReactNode } from "react";

export type MetaRow = {
  label: string;
  /** Rendered as-is, so a value can be a link or carry its own formatting. */
  value: ReactNode;
};

export default function MetaRows({
  rows,
  className = "",
}: {
  rows: MetaRow[];
  className?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <dl className={className}>
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`grid grid-cols-[180px_1fr] items-baseline gap-4 py-[13px] border-t border-ink/16 max-[860px]:grid-cols-1 max-[860px]:gap-1 ${
            i === rows.length - 1 ? "border-b border-ink/16" : ""
          }`}
        >
          <dt className="mh-label text-slate">{row.label}</dt>
          <dd className="text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
