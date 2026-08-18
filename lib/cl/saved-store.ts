// The Classifieds save store.
//
// LOCAL ONLY, ON PURPOSE. Saving is a real feature in the design — screen 06 is
// a whole Saved screen — and a real feature needs a `saved_listings` table with
// its own RLS policy, because a saved list is private to its owner and that is
// exactly the kind of rule that must be enforced at the database layer rather
// than in the UI. This slice makes no schema changes, so the state lives in
// localStorage: enough to prove the interaction and both visual states, and
// nothing that has to be migrated or torn down later. It does not sync across
// devices, and it is not private in any meaningful sense — anything sharing the
// browser profile can read it. It is a prototype of a control.
//
// Extracted from SaveButton when the Saved screen arrived: the pill writes the
// set and the screen reads it, and the two must not disagree about the key or
// the event name.

const KEY = "mh.design.saved";

/** Same-tab fan-out. The native `storage` event only fires in OTHER tabs. */
export const SAVED_CHANGED = "cl-saved-change";

export function readSaved(): Set<string> {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === "string")
        : []
    );
  } catch {
    // Private-mode quota errors and hand-edited garbage both land here. An
    // unreadable store is an empty one; it must never take the page down.
    return new Set();
  }
}

export function writeSaved(next: Set<string>): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...next]));
  } catch {
    /* Storage full or blocked — the in-memory toggle still repaints. */
  }
  window.dispatchEvent(new Event(SAVED_CHANGED));
}

/**
 * Subscribe to the store. Fires once immediately so a caller does not have to
 * seed itself, then on every local toggle and every change in another tab.
 * Returns the unsubscribe.
 */
export function subscribeSaved(onChange: (saved: Set<string>) => void): () => void {
  const sync = () => onChange(readSaved());
  sync();
  window.addEventListener(SAVED_CHANGED, sync);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener(SAVED_CHANGED, sync);
    window.removeEventListener("storage", sync);
  };
}
