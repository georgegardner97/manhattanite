// ClGallery — the photographs at the top of screen 03.
//
// The design draws exactly one arrangement: a lead photograph at 1.5fr beside a
// column of two at 1fr. Real listings carry anywhere from zero to eight photos,
// so the arrangement is chosen from the count rather than assumed:
//
//   0 — nothing at all. An empty warm frame is right on a card, where it holds
//       the grid's shape and the row still reads as a listing; on a detail page
//       it is a large grey rectangle that says only "no photo", and the page
//       reads better going straight from the breadcrumb to the title.
//   1 — full width, capped so a portrait shot can't push the price below the
//       fold.
//   2 — two equal frames, because 1.5fr against a single 1fr reads as a mistake.
//   3+ — the design's own layout, with "+N" over the last frame when there are
//       more photographs than there are frames to put them in.
//
// The "+N" overlay does not open anything. A lightbox is a real component with
// focus management and keyboard handling behind it, and this slice exists to
// judge a visual system — an honest count of what is not on screen is worth
// more here than a half-built one that traps a keyboard.

const LEAD_HEIGHT = "clamp(260px, 30vw, 420px)";

export default function ClGallery({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div className="cl-media" style={{ height: LEAD_HEIGHT }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[0]} alt="" />
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div className="cl-gallery" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {urls.map((url) => (
          <div key={url} className="cl-media" style={{ height: LEAD_HEIGHT }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" />
          </div>
        ))}
      </div>
    );
  }

  const [lead, ...rest] = urls;
  const side = rest.slice(0, 2);
  const hidden = urls.length - 3;

  return (
    <div className="cl-gallery">
      <div className="cl-media" style={{ height: LEAD_HEIGHT }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lead} alt="" />
      </div>

      {/* The stacked pair. On a phone .cl-gallery-side turns this into a row
          beneath the lead rather than two more full-height frames. */}
      <div className="cl-gallery-side">
        {side.map((url, i) => (
          <div key={url} className="cl-media min-h-[110px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" />
            {i === side.length - 1 && hidden > 0 && (
              <div className="cl-media-more">+{hidden}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
