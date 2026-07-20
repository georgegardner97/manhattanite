// Cloudflare Turnstile — the CAPTCHA wall on the sign-up funnel (2026-06-30).
//
// Turnstile is Cloudflare's privacy-friendly CAPTCHA: it proves a real human
// (not a bot) is filling the form, without the click-the-traffic-lights puzzle.
// The widget hands us a short-lived, single-use *token*; we pass that token to
// supabase.auth.signUp, and Supabase verifies it server-side against the
// Turnstile *secret* key (which lives only in the Supabase dashboard — never in
// this repo). See app/signup/page.tsx for the consumer.
//
// This is a Client Component: the widget is browser-only and we expose its
// token to the parent via an onVerify callback. The parent can force a fresh
// challenge through the imperative reset() handle — Turnstile tokens are
// single-use, so after a rejected signUp the old token is spent and the widget
// must be reset before the user can retry.

"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

// The Turnstile *site* key is public and safe to ship in the client bundle.
// Locally (and in any env without the real key set), fall back to Cloudflare's
// "always passes" TEST site key so dev builds don't crash and the flow is
// testable end-to-end. In Vercel this MUST be set to the REAL site key.
const TEST_SITE_KEY = "1x00000000000000000000AA";
const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? TEST_SITE_KEY;

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_ID = "cf-turnstile-script";

// Minimal shape of the global window.turnstile API we use.
type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      size?: "normal" | "flexible" | "compact";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    // Global onload hook the api.js script calls once it's ready.
    onloadTurnstileCallback?: () => void;
  }
}

// Load the Turnstile script exactly once, resolving when window.turnstile is
// ready. Concurrent callers share the same in-flight promise.
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      // Script tag already present (e.g. fast remount) — wait for it.
      if (window.turnstile) {
        resolve();
        return;
      }
      window.onloadTurnstileCallback = () => resolve();
      return;
    }

    window.onloadTurnstileCallback = () => resolve();

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `${SCRIPT_SRC}&onload=onloadTurnstileCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Turnstile script"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export type TurnstileHandle = {
  /** Reset the widget back to an unsolved state and clear any token. */
  reset: () => void;
};

type TurnstileProps = {
  /** Called with the verification token once the user passes the challenge. */
  onVerify: (token: string) => void;
  /** Called when the token expires or the widget errors — clear the token. */
  onExpire?: () => void;
  onError?: () => void;
  /**
   * Widget palette. Cloudflare renders its own chrome, so this is the only
   * lever we have over how it sits on the page — CSS can't reach inside the
   * iframe. "dark" on the park-ground auth screens, "light" everywhere else.
   * Purely cosmetic: the challenge, the token, and the verification are
   * identical either way.
   */
  theme?: "light" | "dark";
};

const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(function Turnstile(
  { onVerify, onExpire, onError, theme = "light" },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Keep the latest callbacks in refs so the render effect can run once on
  // mount without re-rendering the widget every time a parent closure changes.
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  // Same trick for the theme: it's read once, at render time, inside the
  // mount-only effect. A ref keeps the effect's dependency list empty (the
  // widget must render exactly once) without going stale on the first paint.
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }),
    []
  );

  useEffect(() => {
    // Without a key the widget can't render. We default to the TEST key above,
    // so SITE_KEY is always truthy in practice — but guard anyway so a future
    // empty-string override fails soft (render nothing + a dev warning) instead
    // of crashing local dev.
    if (!SITE_KEY) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing — widget not rendered."
        );
      }
      return;
    }

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        // Already rendered (StrictMode double-invoke) — don't double-render.
        if (widgetIdRef.current) return;

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: themeRef.current,
          size: "flexible",
          callback: (token: string) => onVerifyRef.current(token),
          "expired-callback": () => onExpireRef.current?.(),
          "error-callback": () => onErrorRef.current?.(),
        });
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[Turnstile] could not initialise:", error);
        }
        onErrorRef.current?.();
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} />;
});

export default Turnstile;
