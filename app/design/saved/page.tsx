// Screen 06 — Saved, in the Classifieds system.
//
// The listings you saved on Browse, on their own screen. The server's job here
// is only to hand down the same gated read every other screen uses; which of
// those listings are yours is decided in the browser, because that is where the
// save set lives. See SavedGrid for why that split is the safe one.

import AppHeader from "@/app/design/AppHeader";
import SavedGrid from "@/app/design/SavedGrid";
import { readPermittedListings, toClCards } from "@/app/design/listings-read";

export const dynamic = "force-dynamic"; // session state varies per request.

export default async function ClassifiedsSavedPage() {
  const { rows } = await readPermittedListings();

  // Every permitted row is signed, not just the saved ones — the server has no
  // way to know which those are. At the 50-row ceiling that is one round-trip
  // for a handful of unused signatures, which is the price of keeping the gate
  // on the server; it would be worth revisiting if the ceiling ever moved.
  const cards = await toClCards(rows);

  return (
    <>
      <AppHeader active="saved" />

      <main className="mx-auto w-full max-w-[1100px] px-[clamp(16px,2.4vw,28px)] pt-[26px] pb-[clamp(32px,4vw,56px)]">
        <h1 className="text-[clamp(22px,2.4vw,28px)] font-medium tracking-[-0.02em]">
          Saved
        </h1>
        <SavedGrid cards={cards} />
      </main>
    </>
  );
}
