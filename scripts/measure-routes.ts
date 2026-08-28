// Page-speed measurement — the same six samples, every time.
//
// WHY A SCRIPT AND NOT A STOPWATCH. "The site feels slow" is not a number, and
// a performance change with no measurement is a guess. This exists so a
// before/after is reproducible: same routes, same sample count, same statistic,
// and a cache header read on every request so a PRERENDER hit is never mistaken
// for fast server work.
//
// TTFB IS THE SERVER'S HALF. It is time-to-first-byte on the document, so it
// covers DNS + TLS + the round trip + everything the render does, and nothing
// about images. Images are measured separately, by fetching what the HTML
// references — see `npm run measure:page`.
//
// The first sample of each route is discarded as a warm-up: a cold connection
// pays DNS and TLS that later samples reuse, and that is not what is being
// compared.

const BASE = process.env.APP_ORIGIN ?? "https://manhattanite.com";
const SAMPLES = 6;

const ROUTES = ["/terms", "/listings", "/", "/listings?type=furniture"];

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

async function sample(url: string): Promise<{ ms: number; cache: string; bytes: number }> {
  const t0 = performance.now();
  const res = await fetch(url, { cache: "no-store", headers: { "cache-control": "no-cache" } });
  const body = await res.text();
  const ms = Math.round(performance.now() - t0);
  return {
    ms,
    cache: res.headers.get("x-vercel-cache") ?? res.headers.get("x-nextjs-cache") ?? "—",
    bytes: body.length,
  };
}

async function main() {
  console.log(`\nMeasuring ${BASE} — ${SAMPLES} samples per route, first discarded as warm-up.\n`);
  console.log("route                        median    worst    cache            html");
  console.log("─".repeat(76));

  for (const route of ROUTES) {
    const times: number[] = [];
    let cache = "—";
    let bytes = 0;
    for (let i = 0; i <= SAMPLES; i++) {
      const s = await sample(`${BASE}${route}`);
      if (i === 0) continue; // warm-up
      times.push(s.ms);
      cache = s.cache;
      bytes = s.bytes;
    }
    console.log(
      `${route.padEnd(28)} ${String(median(times) + "ms").padEnd(9)} ${String(Math.max(...times) + "ms").padEnd(8)} ${cache.padEnd(16)} ${(bytes / 1024).toFixed(0)}kb`
    );
  }
  console.log("");
}
main().catch((e) => { console.error(e); process.exit(1); });
