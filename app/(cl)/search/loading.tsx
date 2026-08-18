// The route-level loading boundary for Search — screen 11's first panel.

import ClSkeletonGrid from "@/app/components/cl/ClSkeletonGrid";

export default function SearchLoading() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-[clamp(16px,2.4vw,28px)] pt-[26px] pb-[clamp(32px,4vw,56px)]">
      <ClSkeletonGrid count={4} />
    </main>
  );
}
