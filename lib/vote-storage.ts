export type FeedbackEntry = {
  id: string;
  group: string;
  restaurantName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export const storageKeyFor = (restaurantSlug: string) =>
  `smaka-feedback-${restaurantSlug}`;

export const submittedKeyFor = (restaurantSlug: string) =>
  `smaka-feedback-submitted-${restaurantSlug}`;

export function readEntriesFromStorage(restaurantSlug: string): FeedbackEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKeyFor(restaurantSlug));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as FeedbackEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasSubmittedForRestaurant(restaurantSlug: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.localStorage.getItem(submittedKeyFor(restaurantSlug)));
}

export function buildHistogram(entries: FeedbackEntry[]): number[] {
  const buckets = Array.from({ length: 10 }, () => 0);

  for (const entry of entries) {
    const index = entry.rating - 1;
    if (index >= 0 && index < buckets.length) {
      buckets[index] += 1;
    }
  }

  return buckets;
}
