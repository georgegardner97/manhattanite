"use client";

// The profile photo row, in the Classifieds system.
//
// WHY THIS EXISTS AT ALL. Screen 10 draws name, neighborhood, bio, LinkedIn,
// email, password, vouching and leaving — and no photo. Promoting it as drawn
// would have deleted a working feature: migration 0023 added avatar_path,
// AvatarUpload has been live since, and the 2026-06-08 decision put a real
// photo on the profile deliberately, as the GdC-faithful identity surface. A
// mockup that predates a decision does not get to reverse it, and a feature
// should not disappear because nobody drew it. So the row is added back, in
// this system's clothes.
//
// A restyle, not a reimplementation: the same uploadAvatar into the same public
// avatars bucket, RLS-scoped to the user's own folder, and the same hidden
// `avatar_path` field that updateProfile already reads (empty string = removed).
// Only the chrome is new.

import { useRef, useState } from "react";
import { uploadAvatar, AVATAR_ALLOWED_TYPES } from "@/lib/storage/upload-avatar";

const ACCEPT_ATTR = AVATAR_ALLOWED_TYPES.join(",");

export default function ClAvatarUpload({
  userId,
  initialPath,
  initialUrl,
  onDirty,
}: {
  userId: string;
  initialPath: string | null;
  initialUrl: string | null;
  /** Lets the parent form reveal its Save control the moment a photo changes. */
  onDirty?: () => void;
}) {
  const [path, setPath] = useState<string | null>(initialPath);
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    const result = await uploadAvatar(file, userId);
    if (result.ok) {
      setPath(result.path);
      setPreview(URL.createObjectURL(file));
      onDirty?.();
    } else {
      setError(result.error);
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove() {
    setPath(null);
    setPreview(null);
    setError(null);
    onDirty?.();
  }

  return (
    <div
      className="grid grid-cols-[1fr_auto] items-center gap-5 border-t py-[18px]"
      style={{ borderColor: "var(--cl-hairline)" }}
    >
      {/* Rides along on submit with the rest of the form. Empty = no photo. */}
      <input type="hidden" name="avatar_path" value={path ?? ""} />

      <div className="flex min-w-0 items-center gap-4">
        <div className="cl-avatar h-[44px] w-[44px] shrink-0 overflow-hidden">
          {preview && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={preview} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[14.5px]">Photo</div>
          <div
            className="mt-1 truncate text-[13px]"
            style={{
              color: preview ? "var(--cl-muted)" : "var(--cl-disabled)",
            }}
          >
            {error ?? (preview ? "Added" : "Not set")}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <label className="cl-quiet cursor-pointer text-[13px]">
          {busy ? "Uploading…" : preview ? "Change" : "Add"}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            disabled={busy}
            onChange={(e) => handleFile(e.target.files)}
            className="sr-only"
          />
        </label>
        {preview && (
          <button
            type="button"
            onClick={remove}
            className="cl-quiet text-[13px]"
            style={{ color: "var(--cl-faint)" }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
