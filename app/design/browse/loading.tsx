// The route-level loading boundary for Browse — screen 11's first panel.
//
// Next renders this while the page's gated read and image signing run. It
// deliberately draws only the grid, not the header and rail: those come back
// identically on every request, so shimmering them implies they might not.

import ClSkeletonGrid from "@/app/design/ClSkeletonGrid";

export default function BrowseLoading() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-[clamp(16px,2.4vw,28px)] pt-[22px] pb-[clamp(32px,4vw,56px)]">
      <ClSkeletonGrid />
    </main>
  );
}
