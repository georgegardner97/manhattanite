"use client";

// The Classifieds photo picker.
//
// A restyle, not a reimplementation: it calls the same uploadListingImage the
// live form calls, so files land in the same private bucket under the same
// owner-scoped RLS, and it writes the same hidden `images` JSON field that
// createListing reads. Only the chrome is new — the live ImageUpload is dressed
// in the editorial system (bone, hairline borders, square corners) and would
// have been the one obviously foreign object on the screen.
//
// The design says "up to eight photos". The real cap is six
// (MAX_IMAGES_PER_LISTING), enforced server-side too, so six is what this says.

import { useRef, useState } from "react";
import {
  MAX_IMAGES_PER_LISTING,
  uploadListingImage,
} from "@/lib/storage/upload-listing-image";

type Item = { path: string; previewUrl: string };

export default function ClImageUpload({
  userId,
  initial,
}: {
  userId: string;
  /** The listing's current photos, on the edit route. */
  initial?: Item[];
}) {
  // Seeded once. The existing paths ride along in the same hidden `images`
  // field as new uploads, because updateListing replaces the set wholesale —
  // an existing photo left out of the submit is an existing photo removed.
  const [items, setItems] = useState<Item[]>(initial ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);

    const available = MAX_IMAGES_PER_LISTING - items.length;
    if (available <= 0) {
      setError(`You can add up to ${MAX_IMAGES_PER_LISTING} photos.`);
      return;
    }

    setBusy(true);
    const added: Item[] = [];
    for (const file of Array.from(list).slice(0, available)) {
      const result = await uploadListingImage(file, userId);
      if (!result.ok) {
        setError(result.error);
        break;
      }
      added.push({ path: result.path, previewUrl: URL.createObjectURL(file) });
    }
    if (added.length) setItems((prev) => [...prev, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(path: string) {
    setItems((prev) => {
      const gone = prev.find((p) => p.path === path);
      // Release the blob URL, or every removed photo leaks for the page's life.
      // Only ours: an already-stored photo arrives as a signed https URL, and
      // revoking one of those is a no-op at best.
      if (gone?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(gone.previewUrl);
      return prev.filter((p) => p.path !== path);
    });
    setError(null);
  }

  return (
    <div>
      {/* What createListing and updateListing actually read. The previews are
          for the person. */}
      <input
        type="hidden"
        name="images"
        value={JSON.stringify(items.map((i) => ({ path: i.path })))}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {items.map((item, i) => (
          <div key={item.path} className="cl-media relative h-[150px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.previewUrl} alt="" />
            {i === 0 && (
              <span className="cl-chip cl-chip-xs cl-tag-vouched absolute left-2 top-2">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(item.path)}
              aria-label="Remove photo"
              className="absolute right-2 top-2 rounded-full px-2.5 py-1 text-[11.5px]"
              style={{ background: "rgba(251,250,249,.92)", color: "var(--cl-ink)" }}
            >
              Remove
            </button>
          </div>
        ))}

        {items.length < MAX_IMAGES_PER_LISTING && (
          <label
            className="flex h-[150px] cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed text-center text-[13px]"
            style={{
              borderColor: "var(--cl-border-control)",
              color: "var(--cl-muted)",
            }}
          >
            {busy ? "Uploading…" : items.length === 0 ? "Cover photo" : "Add photo"}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={busy}
              onChange={(e) => handleFiles(e.target.files)}
              className="sr-only"
            />
          </label>
        )}
      </div>

      <p className="mt-3.5 text-[12.5px]" style={{ color: "var(--cl-muted)" }}>
        Up to {MAX_IMAGES_PER_LISTING} photos. The first is the cover.
      </p>

      {error && <p className="cl-fielderror mt-2">{error}</p>}
    </div>
  );
}
