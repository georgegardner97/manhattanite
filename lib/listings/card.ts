// Shared presentation helpers for ListingCard.
//
// Design foundation, Slice 1. The landing band ("outside", dark) and the browse
// feed ("inside", light) render the same card from the same database row, so
// the row → card mapping lives here rather than being written twice.
//
// This module is display logic only. It reads columns the pages already have
// permission to select; it does not touch the data layer.

import type { ListingCardData } from "@/app/components/ListingCard";

export type ListingType = "apartment" | "furniture" | "other" | "service";

export type ListingRow = {
  id: string;
  type: ListingType;
  title: string;
  description?: string | null;
  price_cents: number;
  created_at: string;
  images: { path: string }[] | null;
  details: Record<string, unknown> | null;
  is_example: boolean;
};

// Apartments are monthly; everything else is a one-off price.
export function formatPrice(cents: number, type: ListingType): string {
  const dollars = Math.round(cents / 100).toLocaleString("en-US");
  return type === "apartment" ? `$${dollars}/mo` : `$${dollars}`;
}

// "July 14" — no year. Pinned to New York time so a listing posted late in the
// evening doesn't render as the next day on a UTC server.
export function formatPostedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

const TYPE_LABEL: Record<ListingType, string> = {
  apartment: "Apartment",
  furniture: "Furniture",
  other: "Other",
  service: "Service",
};

// The kicker's left slot. Neighborhood when the listing has one (apartments
// always do); otherwise the category, so the row never renders half-empty.
export function placeOf(row: ListingRow): string {
  const neighborhood = row.details?.neighborhood;
  return typeof neighborhood === "string" && neighborhood.trim()
    ? neighborhood.trim()
    : TYPE_LABEL[row.type];
}

export function toCardData(
  row: ListingRow,
  coverUrl: string | null,
  byline?: string | null
): ListingCardData {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    place: placeOf(row),
    price: formatPrice(row.price_cents, row.type),
    postedAt: formatPostedDate(row.created_at),
    coverUrl,
    isExample: row.is_example,
    byline: byline ?? null,
  };
}
