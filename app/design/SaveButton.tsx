"use client";

// SaveButton — the save control on a Classifieds listing.
//
// Three variants, one store. The store — and the reasons it is localStorage
// rather than a table — lives in saved-store.ts, which the Saved screen also
// reads. The store is shared rather than per-button so every pill on the page
// agrees about the same listing, and so a second tab stays in step.

import { useCallback, useEffect, useState } from "react";
import { readSaved, subscribeSaved, writeSaved } from "@/app/design/saved-store";

export type SaveVariant = "overlay" | "block" | "remove";

const LABELS: Record<SaveVariant, { on: string; off: string }> = {
  overlay: { on: "Saved", off: "Save" },
  block: { on: "Saved", off: "Save listing" },
  remove: { on: "Remove", off: "Save listing" },
};

export default function SaveButton({
  id,
  title,
  variant = "overlay",
}: {
  id: string;
  /** Used for the accessible name — "Save" alone is ambiguous in a grid. */
  title: string;
  variant?: SaveVariant;
}) {
  // Always starts false so the server-rendered markup and the first client
  // render agree; the effect below corrects it immediately after mount.
  // localStorage is unreadable during SSR, so there is no way to be right on
  // the first paint, and a hydration mismatch would be worse than a flicker.
  const [saved, setSaved] = useState(false);

  useEffect(
    () => subscribeSaved((set) => setSaved(set.has(id))),
    [id]
  );

  const toggle = useCallback(() => {
    const next = readSaved();
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeSaved(next);
  }, [id]);

  const label = LABELS[variant];

  // "remove" is the one variant that is not a pill: it is the design's quiet
  // red text under a Saved card, so it takes .cl-quiet and the red accent
  // rather than the save chrome.
  const className =
    variant === "remove"
      ? "cl-quiet mt-2.5 block text-[12.5px]"
      : `cl-save${variant === "block" ? " cl-save-block" : ""}${
          saved ? " cl-save-on" : ""
        }`;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
      className={className}
      style={variant === "remove" ? { color: "var(--cl-red)" } : undefined}
    >
      {saved ? label.on : label.off}
    </button>
  );
}
