// Screen 11, first panel — the loading state, in the Classifieds system.
//
// The design draws it as the card grid with the type and photograph replaced by
// shimmering blocks, in the proportions of a real card: media, then a short
// kicker, a long title, a medium byline. That shape is the point — a skeleton
// whose blocks are the size of the content they stand in for holds the layout
// still when the real thing arrives, and a spinner does not.
//
// It has two homes, which is why it is a component rather than markup inside
// one page:
//
//   1. app/design/browse/loading.tsx and app/design/search/loading.tsx — the
//      Next.js route boundary, shown while the server component's queries run.
//   2. The Saved screen, which cannot know what is saved until localStorage is
//      readable, i.e. not until after hydration. Same wait, same picture.
//
// Widths vary slightly per card. A skeleton grid whose every title block is
// exactly 88% wide reads as a graphic; the small variation reads as text.

const SHAPES = [
  { title: "88%", meta: "64%" },
  { title: "80%", meta: "70%" },
  { title: "92%", meta: "58%" },
  { title: "74%", meta: "66%" },
  { title: "84%", meta: "72%" },
  { title: "90%", meta: "60%" },
];

export default function ClSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    // aria-hidden + a live-region label: a screen reader should hear "Loading
    // listings" once, not six paragraphs of placeholder geometry.
    <div
      className="mt-[26px] grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[clamp(22px,2.4vw,34px)]"
      role="status"
      aria-label="Loading listings"
    >
      {Array.from({ length: count }, (_, i) => {
        const shape = SHAPES[i % SHAPES.length];
        return (
          <div key={i} aria-hidden="true">
            <div
              className="cl-sk"
              style={{ height: "clamp(170px, 15vw, 210px)" }}
            />
            <div className="cl-sk mt-3.5 h-[11px] w-1/2" />
            <div className="cl-sk mt-2.5 h-[14px]" style={{ width: shape.title }} />
            <div className="cl-sk mt-2.5 h-[11px]" style={{ width: shape.meta }} />
          </div>
        );
      })}
    </div>
  );
}
