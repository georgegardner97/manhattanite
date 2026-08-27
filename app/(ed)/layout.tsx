// The editorial system — bone, ink, park green, Instrument Serif + Inter.
//
// This is the design foundation the site has been running on, and it is what
// every route NOT yet migrated to the Classifieds system still uses: the whole
// member area, the admin console, the threshold screens, terms and privacy.
// Slices 2 and 3 of the Classifieds migration empty this group out from the
// inside. Until then it is load-bearing, and none of it is dead code.
//
// It owns three things the root layout used to:
//
//   1. THE FONTS. Inter for body, Instrument Serif for display and the
//      wordmark. Applied to the wrapper below rather than <body>, so a
//      Classifieds page never downloads or preloads Inter.
//
//   2. THE SCOPE. `.ed-root` is where globals.css resolves the Inter
//      var() reference and the editorial tracking. One wrapper, one scope —
//      the mirror of `.cl-root` in the other group.
//
//   3. THE NAV. SiteNav, wrapped in NavGate, which stands it down on the
//      threshold screens that carry their own centered wordmark.

import { inter, instrumentSerif } from "@/app/fonts";
import SiteNav from "@/app/components/SiteNav";
import NavGate from "@/app/components/NavGate";

export default function EditorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} ${instrumentSerif.variable} ed-root`}>
      {/* NavGate hides the nav on the threshold routes and must do it on the
          client — this layout does not re-render on client-side navigation. */}
      <NavGate>
        <SiteNav />
      </NavGate>
      {children}
    </div>
  );
}
