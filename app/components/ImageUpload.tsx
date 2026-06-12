// Client component: photo uploader for the post-a-listing form.
//
// Each chosen file is uploaded to Supabase Storage immediately on selection.
// We hold the returned path + a local object URL (for the thumbnail) in
// component state. When the user submits the parent form, the paths ride
// along as a single hidden JSON field — the server action stores them on
// the listing row.
//
// Why upload-on-select rather than upload-on-submit:
//   1. Faster perceived submit (the heavy bytes are already in storage).
//   2. The form's server action stays small and synchronous-feeling.
//   3. If the user abandons the form, those uploads become orphan files in
//      Storage. That's a known v1 tradeoff — a cleanup job can prune
//      anything not referenced by a listing in a later pass.
//
// The upload helper validates MIME + size client-side; the bucket re-enforces
// both server-side. The RLS upload policy is the actual gate.

"use client";

import { useRef, useState } from "react";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES_PER_LISTING,
  MAX_IMAGE_BYTES,
  uploadListingImage,
} from "@/lib/storage/upload-listing-image";

const ACCEPT_ATTR = ALLOWED_IMAGE_TYPES.join(",");

type UploadedItem = {
  path: string;
  previewUrl: string; // local object URL (new uploads) or signed URL (existing)
};

export default function ImageUpload({
  userId,
  initialItems,
}: {
  userId: string;
  // Edit mode: the listing's current images, pre-signed server-side so the
  // thumbnails render. Removing one here just drops its path from the hidden
  // field — the file stays in Storage (same orphan tradeoff as above).
  initialItems?: UploadedItem[];
}) {
  const [items, setItems] = useState<UploadedItem[]>(initialItems ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const available = MAX_IMAGES_PER_LISTING - items.length;
    if (available <= 0) {
      setError(`You can add up to ${MAX_IMAGES_PER_LISTING} photos.`);
      return;
    }

    const files = Array.from(fileList).slice(0, available);
    if (fileList.length > available) {
      setError(
        `That's more than the ${MAX_IMAGES_PER_LISTING}-photo limit — kept the first ${available}.`
      );
    }

    setBusy(true);
    const newItems: UploadedItem[] = [];
    for (const file of files) {
      const result = await uploadListingImage(file, userId);
      if (result.ok) {
        newItems.push({
          path: result.path,
          previewUrl: URL.createObjectURL(file),
        });
      } else {
        setError(result.error);
        break;
      }
    }
    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeItem(path: string) {
    setItems((prev) => {
      const removed = prev.find((p) => p.path === path);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((p) => p.path !== path);
    });
    setError(null);
  }

  const remaining = MAX_IMAGES_PER_LISTING - items.length;
  const sizeMb = Math.round(MAX_IMAGE_BYTES / 1024 / 1024);

  return (
    <div className="border-t border-ink/10 pt-8">
      <p className="text-[13px] tracking-[0.22em] uppercase text-slate mb-5">
        Photos
        <span className="font-serif italic normal-case tracking-normal text-slate/70 ml-1">
          (up to {MAX_IMAGES_PER_LISTING}, {sizeMb}&nbsp;MB each)
        </span>
      </p>

      {/* Paths ride along on submit as a single JSON field. */}
      <input
        type="hidden"
        name="images"
        value={JSON.stringify(items.map((i) => i.path))}
      />

      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-4 mb-6">
          {items.map((item) => (
            <li key={item.path} className="relative aspect-square group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt=""
                className="w-full h-full object-cover border border-ink/10"
              />
              <button
                type="button"
                onClick={() => removeItem(item.path)}
                className="absolute top-1 right-1 bg-bone/90 text-ink text-[10px] tracking-[0.18em] uppercase px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-bone"
                aria-label="Remove photo"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <label className="inline-block cursor-pointer text-[13px] tracking-[0.22em] uppercase text-ink border border-ink/30 px-6 py-3 hover:bg-ink hover:text-bone transition-colors duration-200">
          {busy
            ? "Uploading…"
            : items.length === 0
              ? "Add photos"
              : "Add more"}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            multiple
            disabled={busy}
            onChange={(e) => handleFiles(e.target.files)}
            className="sr-only"
          />
        </label>
      )}

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <p className="mt-4 text-slate text-sm leading-relaxed">
        The first photo is the cover.
      </p>
    </div>
  );
}
