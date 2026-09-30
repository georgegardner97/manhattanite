// A member's one link: Instagram, LinkedIn, a website, anything on the web.
//
// WIDENED FROM LINKEDIN ONLY (George, 2026-09-30). The field used to accept
// linkedin.com and nothing else, because a profile field was not to hand
// members an arbitrary outbound link on our say-so. George chose to open it,
// with the mitigation that the member page labels the link with its SITE
// ("instagram.com"), so a member sees where it goes before clicking, and it
// opens in a new tab with rel="nofollow ugc". The column is still called
// linkedin_url; renaming a live column to change a noun buys nothing.
//
// One parser for both writes (the joining profile and profile edit) and the
// read (the member page), so a value that is accepted is a value that renders.

export const MAX_PROFILE_LINK = 200;

/** A cleaned, absolute http(s) address, or null when the text is not one. */
export function parseProfileLink(raw: string | null): URL | null {
  const trimmed = raw?.trim() ?? "";
  if (trimmed === "") return null;
  // Most people paste "instagram.com/you" with no scheme.
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  // Web addresses only: never javascript:, data:, mailto: and the like.
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  // A real host name, not "localhost" or a bare word.
  if (!url.hostname.includes(".")) return null;
  // "https://instagram.com@evil.example" reads as Instagram and goes elsewhere.
  if (url.username || url.password) return null;
  return url;
}

/** For the forms: the value to store, or the message to show. */
export function checkProfileLink(
  raw: string | null
): { value: string | null; error: string | null } {
  const trimmed = raw?.trim() ?? "";
  if (trimmed === "") return { value: null, error: null };
  if (trimmed.length > MAX_PROFILE_LINK) {
    return {
      value: null,
      error: `Keep the link to ${MAX_PROFILE_LINK} characters or fewer.`,
    };
  }
  const url = parseProfileLink(trimmed);
  if (!url) {
    return {
      value: null,
      error: "That link doesn't look right. Paste the whole address, or leave it blank.",
    };
  }
  return { value: url.toString(), error: null };
}

/** For the member page: where it goes, and the site name to label it with. */
export function profileLinkDisplay(
  raw: string | null
): { href: string; site: string } | null {
  const url = parseProfileLink(raw);
  if (!url) return null;
  return {
    href: url.toString(),
    site: url.hostname.toLowerCase().replace(/^www\./, ""),
  };
}
