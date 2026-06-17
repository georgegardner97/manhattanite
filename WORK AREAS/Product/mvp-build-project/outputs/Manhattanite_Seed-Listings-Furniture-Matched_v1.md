# Manhattanite — Furniture seed listings (matched to George's photos) v1

These 7 furniture listings are written to match the 7 furniture images George supplied (2026-06-12),
so each listing's text agrees with its photo. They REPLACE the named-designer furniture (F1–F15) in
`Manhattanite_Seed-Listings_v1.md` for the first seed — those designer pieces stay deferred until
matching product shots exist.

Convention (same as the apartments): `is_example = true`, status published, American spelling, members
first-name only, sponsor = George during seed. Honest about condition, defects photographed, Manhattan pickup.

---

### FM1 — image: beige lounge chair on oak swivel base
**Swivel lounge chair, oak base · $480**

A low lounge chair in oatmeal, on a solid oak swivel base — the kind you actually sink into, not just
look at. Light pilling on the seat, photographed honestly. From a Tribeca apartment, owner redecorating.
Pickup Tribeca.

Listed by Anna · category: lounge chair · condition: good · neighborhood: Tribeca · tags: lounge chair, oak, swivel

---

### FM2 — image: rust/terracotta two-seater sofa, sage wall
**Terracotta two-seater sofa · $950**

A compact two-seater in rust linen with tapered oak legs. Two years old, no pets, no stains — the colour
reads warmer in person than on a screen. Fits through a standard doorway. Pickup East Village, two people
to move.

Listed by Max · category: sofa · condition: excellent · neighborhood: East Village · tags: sofa, linen, two-seater

---

### FM3 — image: mustard-yellow accent armchair
**Mustard accent armchair · $320**

A mid-century-style armchair in mustard with black tapered legs — a warm note for an otherwise quiet room.
One small mark on the inside of the arm, otherwise clean. Pickup Chelsea.

Listed by Lila · category: armchair · condition: good · neighborhood: Chelsea · tags: armchair, mid-century, mustard

---

### FM4 — image: white ceramic pineapple table lamp
**Ceramic pineapple table lamp · $60**

A white ceramic table lamp with a natural linen shade — a little wit for a side table or a nightstand.
Rewired last year, takes a standard bulb. Pickup Murray Hill.

Listed by George · category: lighting · condition: good · neighborhood: Murray Hill · tags: lamp, ceramic, table lamp

---

### FM5 — image: black molded (Eames-style) armchair
**Molded shell armchairs, black — pair · $260**

Black molded armchairs on black dowel bases — the Eames silhouette, a good reproduction, not the originals.
Solid, comfortable, and they wipe clean. Selling the pair. Pickup Soho.

Listed by George · category: armchair · condition: good · neighborhood: Soho · tags: armchair, Eames-style, pair

---

### FM6 — image: reclaimed-wood coffee table, hairpin legs
**Reclaimed-wood coffee table · $220**

Forty-eight inches of reclaimed pine on grey steel hairpin legs. The kind of honest wood that takes a ring
or two and looks better for it. Pickup Lower East Side.

Listed by Sam · category: coffee table · condition: good · neighborhood: Lower East Side · tags: coffee table, reclaimed wood, hairpin

---

### FM7 — image: whitewashed wood bar stool, blue ground
**Whitewashed bar stools — pair · $130**

Two solid-wood bar stools, whitewashed, with a thirty-inch seat and a hand-hole to carry them. Sturdy and
simple. Selling the pair. Pickup Tribeca.

Listed by Anna · category: bar stool · condition: good · neighborhood: Tribeca · tags: bar stool, wood, pair

---

## How these get used

- One image each (the matching photo), uploaded to the listing-images bucket; `images[0]` is the cover.
- `type = 'furniture'`; `details` jsonb: `{ category, condition, neighborhood, tags }`.
- Authors distributed across the example members (Anna, Max, Lila, Sam) + George, sponsor = George.
- Total first seed = 10 apartments + these 7 furniture = **17 example listings**.
