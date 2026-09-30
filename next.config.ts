import type { NextConfig } from "next";

// Security headers, sent with every response.
//
// The Content-Security-Policy (CSP) is the browser's allowlist: it names the
// only places this site may load scripts, images, frames and connections
// from, so an injected <script src="evil.example"> simply does not run.
// Three outside origins are allowed, and each is here for one reason:
//   - Supabase: listing photos and avatars (img-src), and the browser client's
//     auth + storage calls (connect-src).
//   - challenges.cloudflare.com: the Turnstile bot check on sign up, sign in
//     and password reset (its script, its iframe, its calls).
// 'unsafe-inline' on scripts is what Next requires without per-request nonces,
// and nonces would force every page dynamic, which undoes the caching on
// /listings. If a new outside service is added (analytics, maps, a font CDN),
// it must be added here or the browser will silently block it.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const turnstile = "https://challenges.cloudflare.com";
const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${turnstile}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${supabase}`,
  "font-src 'self'",
  `connect-src 'self' ${supabase} ${supabase.replace(/^https/, "wss")} ${turnstile}`,
  `frame-src ${turnstile}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Nobody may show this site inside a frame on theirs (clickjacking).
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Older browsers' version of frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // Stop the browser guessing a file's type (an upload served as a script).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites learn only that a visitor came from manhattanite.com, never
  // which listing or member page.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site uses none of these, so no page (or injected script) may ask.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Strict-Transport-Security (HTTPS only) is already sent by Vercel.
];

const nextConfig: NextConfig = {
  // Don't advertise the framework in every response header.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
