"use client";

// The account rows on /profile — screen 10's label/value list, with the write
// paths brought onto the same screen.
//
// TWO ROUTES, ONE SCREEN. The product had /profile (read) and /profile/edit
// (write); the design draws one screen with inline rows. Collapsing them means
// the rows themselves have to write, so this is the form and the view at once:
// a row shows its value until you press Edit, then it becomes the input for
// that value, in place.
//
// EVERY FIELD IS MOUNTED THE WHOLE TIME, exactly as ClPostForm does it, and for
// a sharper reason here. updateProfile writes all five columns from whatever
// FormData it is handed and treats an absent field as null — so a form that
// mounted only the row being edited would blank the other four on every save.
// Fields are hidden with CSS, never unmounted. This is the bug the pattern
// invites, and it is why the closed rows are `hidden` rather than `&&`.
//
// One Save for the whole form, revealed only once something is actually dirty:
// a settings screen with a permanently live Save button invites people to press
// it having changed nothing, and then to wonder what they just did.
//
// The write path is the existing updateProfile server action, unchanged — same
// validation, same RLS read-own/update-own gate, same protect_account_columns
// trigger backstopping role / is_member / sponsor_id / email. No new reach.

import { useActionState, useState } from "react";
import Link from "next/link";
import { updateProfile, type UpdateProfileState } from "@/lib/profile/update";
import ClAvatarUpload from "@/app/components/cl/ClAvatarUpload";

const INITIAL: UpdateProfileState = { error: null };

type FieldKey = "name" | "neighborhood" | "bio" | "linkedin_url";

export default function ClProfileForm({
  userId,
  email,
  name,
  neighborhood,
  bio,
  linkedinUrl,
  avatarPath,
  avatarUrl,
}: {
  userId: string;
  email: string;
  name: string | null;
  neighborhood: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, INITIAL);
  const [open, setOpen] = useState<Set<FieldKey>>(new Set());
  const [dirty, setDirty] = useState(false);

  function toggle(key: FieldKey) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <form action={formAction}>
      <div className="flex flex-col">
        <ClAvatarUpload
          userId={userId}
          initialPath={avatarPath}
          initialUrl={avatarUrl}
          onDirty={() => setDirty(true)}
        />

        <Row
          fieldKey="name"
          label="Name"
          value={name}
          isOpen={open.has("name")}
          onToggle={toggle}
        >
          <input
            name="name"
            defaultValue={name ?? ""}
            maxLength={80}
            placeholder="e.g. George Gardner"
            className="cl-input"
            onChange={() => setDirty(true)}
          />
        </Row>

        {/* Read-only: changing an email is an auth operation with a
            confirmation round-trip, not a profile field. */}
        <Row label="Email" value={email} />

        <Row
          fieldKey="neighborhood"
          label="Neighborhood"
          value={neighborhood}
          isOpen={open.has("neighborhood")}
          onToggle={toggle}
        >
          <input
            name="neighborhood"
            defaultValue={neighborhood ?? ""}
            maxLength={60}
            placeholder="e.g. West Village"
            className="cl-input"
            onChange={() => setDirty(true)}
          />
        </Row>

        <Row
          fieldKey="bio"
          label="Bio"
          value={bio}
          isOpen={open.has("bio")}
          onToggle={toggle}
        >
          <textarea
            name="bio"
            defaultValue={bio ?? ""}
            maxLength={500}
            rows={4}
            placeholder="What members might want to know about you."
            className="cl-textarea"
            onChange={() => setDirty(true)}
          />
        </Row>

        <Row
          fieldKey="linkedin_url"
          label="LinkedIn"
          value={linkedinUrl}
          isOpen={open.has("linkedin_url")}
          onToggle={toggle}
        >
          <input
            name="linkedin_url"
            defaultValue={linkedinUrl ?? ""}
            maxLength={200}
            placeholder="linkedin.com/in/you"
            className="cl-input"
            onChange={() => setDirty(true)}
          />
        </Row>

        {/* Password is an auth flow, not a column — the row hands off to the
            real reset rather than pretending to hold a value. */}
        <div
          className="grid grid-cols-[1fr_auto] items-center gap-5 border-t py-[18px]"
          style={{ borderColor: "var(--cl-hairline)" }}
        >
          <div className="min-w-0">
            <div className="text-[14.5px]">Password</div>
            <div className="mt-1 truncate text-[13px]" style={{ color: "var(--cl-muted)" }}>
              ••••••••
            </div>
          </div>
          <Link href="/reset-request" className="cl-quiet text-[13px]">
            Reset
          </Link>
        </div>
      </div>

      {state.error && (
        <p className="cl-fielderror mt-4" role="alert">
          {state.error}
        </p>
      )}

      {dirty && (
        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending}
            className={isPending ? "cl-pill-disabled" : "cl-pill"}
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
          <span className="text-[12.5px]" style={{ color: "var(--cl-faint)" }}>
            Changing your name updates it on everything you&rsquo;ve posted.
          </span>
        </div>
      )}
    </form>
  );
}

function Row({
  fieldKey,
  label,
  value,
  isOpen,
  onToggle,
  children,
}: {
  fieldKey?: FieldKey;
  label: string;
  value: string | null | undefined;
  isOpen?: boolean;
  onToggle?: (key: FieldKey) => void;
  children?: React.ReactNode;
}) {
  const editable = Boolean(fieldKey && onToggle);

  return (
    <div
      className="grid grid-cols-[1fr_auto] items-center gap-5 border-t py-[18px]"
      style={{ borderColor: "var(--cl-hairline)" }}
    >
      <div className="min-w-0">
        <div className="text-[14.5px]">{label}</div>
        {/* The value line and the input occupy the same slot — the row becomes
            the field rather than growing a second one below it. */}
        <div hidden={isOpen} className="mt-1 truncate text-[13px]"
          style={{ color: value ? "var(--cl-muted)" : "var(--cl-disabled)" }}
        >
          {value || "Not set"}
        </div>
        {/* Never unmounted: see the note at the top. */}
        {editable && (
          <div hidden={!isOpen} className="mt-2.5 max-w-[420px]">
            {children}
          </div>
        )}
      </div>

      {editable && (
        <button
          type="button"
          onClick={() => onToggle!(fieldKey!)}
          className="cl-quiet shrink-0 text-[13px]"
          aria-expanded={isOpen}
        >
          {isOpen ? "Done" : "Edit"}
        </button>
      )}
    </div>
  );
}
