// SkylineMark — the hand-drawn NYC skyline (brownstone roofline + water towers)
// that was the masthead signature of the pre-v8 landing page.
//
// Not currently mounted anywhere. The v8 redesign ("dark outside, light inside")
// replaced the drawn masthead with a photographic hero, but the drawing is an
// original asset worth keeping — extracted here out of the old app/page.tsx so
// it survives as a file rather than only in git history. Decorative, so callers
// should mark it aria-hidden.

export default function SkylineMark({
  className = "w-[min(440px,84%)] mx-auto text-ink",
}: {
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      <svg
        viewBox="0 0 480 150"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="square"
        strokeLinejoin="miter"
        className="w-full h-auto block"
      >
        <line x1="6" y1="140" x2="474" y2="140" />
        <path d="M30 140 V70 H92 V58 H150 V84 H210 V64 H276 V52 H338 V80 H398 V66 H452 V140" />
        <line x1="30" y1="76" x2="92" y2="76" />
        <line x1="92" y1="64" x2="150" y2="64" />
        <line x1="150" y1="90" x2="210" y2="90" />
        <line x1="210" y1="70" x2="276" y2="70" />
        <line x1="276" y1="58" x2="338" y2="58" />
        <line x1="338" y1="86" x2="398" y2="86" />
        <line x1="398" y1="72" x2="452" y2="72" />
        <rect x="44" y="92" width="12" height="16" />
        <rect x="66" y="92" width="12" height="16" />
        <rect x="44" y="116" width="12" height="16" />
        <rect x="66" y="116" width="12" height="16" />
        <rect x="108" y="80" width="12" height="16" />
        <rect x="128" y="80" width="12" height="16" />
        <rect x="108" y="104" width="12" height="16" />
        <rect x="128" y="104" width="12" height="16" />
        <rect x="232" y="86" width="12" height="16" />
        <rect x="252" y="86" width="12" height="16" />
        <rect x="232" y="110" width="12" height="16" />
        <rect x="252" y="110" width="12" height="16" />
        <rect x="356" y="100" width="12" height="16" />
        <rect x="376" y="100" width="12" height="16" />
        <rect x="416" y="88" width="12" height="16" />
        <g>
          <path d="M296 52 l9 -16 h26 l9 16 Z" />
          <rect x="298" y="52" width="34" height="20" />
          <line x1="302" y1="72" x2="300" y2="80" />
          <line x1="328" y1="72" x2="330" y2="80" />
        </g>
        <g>
          <path d="M118 58 l7 -12 h20 l7 12 Z" />
          <rect x="120" y="58" width="28" height="16" />
        </g>
      </svg>
    </div>
  );
}
