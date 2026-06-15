"use client";

// AvatarUpload — single optional profile photo for Profile → Edit.
// Uploads on select to the public avatars bucket; the chosen path rides along
// on form submit as a hidden `avatar_path` field (empty string = no photo /
// removed). Shows a round preview with a placeholder when empty.

import { useRef, useState } from "react";
import { uploadAvatar, AVATAR_ALLOWED_TYPES } from "@/lib/storage/upload-avatar";

const ACCEPT_ATTR = AVATAR_ALLOWED_TYPES.join(",");

export default function AvatarUpload({
  userId,
  initialPath,
  initialUrl,
}: {
  userId: string;
  initialPath: string | null;
  initialUrl: string | null;
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
  }

  return (
    <div>
      <p className="block text-[13px] tracking-[0.22em] uppercase text-slate mb-5">
        Profile photo
        <span className="font-serif italic normal-case tracking-normal text-slate/70 ml-1">
          (optional)
        </span>
      </p>

      {/* Rides along on submit. Empty string = no photo. */}
      <input type="hidden" name="avatar_path" value={path ?? ""} />

      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-ink/[0.06] flex items-center justify-center shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate text-[10px] tracking-[0.18em] uppercase">
              Photo
            </span>
          )}
        </div>

        <div className="flex items-center gap-5">
          <label className="inline-block cursor-pointer text-[12px] tracking-[0.22em] uppercase text-ink border border-ink/30 px-5 py-2.5 hover:bg-ink hover:text-bone transition-colors duration-200">
            {busy ? "Uploading…" : preview ? "Change" : "Add a photo"}
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
              className="text-[12px] tracking-[0.22em] uppercase text-slate hover:text-ink cursor-pointer"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <p className="mt-4 text-slate text-sm leading-relaxed">
        A photo helps members put a face to your name.
      </p>
    </div>
  );
}
