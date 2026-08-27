// /profile/edit — kept as a redirect, not deleted.
//
// Editing moved onto /profile itself in Slice 2: the Classifieds account screen
// carries the fields as inline rows with their own write paths, so a separate
// edit route has nothing left to render. Deleting it outright would break every
// link that already points here — approval emails, the old profile page's own
// "Edit profile" button, anything a member has bookmarked. So the route stays
// and forwards.
//
// A permanent redirect would be the honest status code, but it is cached hard by
// browsers and would be painful to walk back if editing ever earns its own page
// again. This is a plain (307) redirect for that reason.

import { redirect } from "next/navigation";

export default function ProfileEditRedirect() {
  redirect("/profile");
}
