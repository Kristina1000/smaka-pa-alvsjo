"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readActiveGroup } from "@/components/save-group-to-storage";
import {
  allRestaurants,
  allGroupDefinitions,
  getGroupRouteBySlug,
  type GroupSlug,
} from "@/lib/tour-data";
import {
  hasSubmittedForRestaurant,
} from "@/lib/vote-storage";

type RestaurantStats = {
  slug: string;
  name: string;
  votes: number;
  histogram: number[];
};

type ApiReview = {
  restaurantName?: string;
  rating?: number | string;
};

function isGroupSlug(value: string): value is GroupSlug {
  return allGroupDefinitions.some((group) => group.slug === value);
}

function hasCompletedAllVotes(groupSlug: GroupSlug): boolean {
  const groupRoute = getGroupRouteBySlug(groupSlug);
  if (!groupRoute) {
    return false;
  }

  return groupRoute.restaurants.every((restaurant) =>
    hasSubmittedForRestaurant(restaurant.slug),
  );
}

function normalizeRestaurantName(value: string): string {
  return value.trim().toLowerCase();
}

function buildRestaurantStats(reviews: ApiReview[]): RestaurantStats[] {
  const initialStats: RestaurantStats[] = allRestaurants.map((restaurant) => ({
    slug: restaurant.slug,
    name: restaurant.name,
    votes: 0,
    histogram: Array.from({ length: 10 }, () => 0),
  }));

  const statsByRestaurant = new Map<string, RestaurantStats>();
  for (const stats of initialStats) {
    statsByRestaurant.set(normalizeRestaurantName(stats.name), stats);
  }

  for (const review of reviews) {
    const restaurantName =
      typeof review.restaurantName === "string" ? review.restaurantName : "";
    const ratingNumber =
      typeof review.rating === "number"
        ? review.rating
        : Number.parseInt(String(review.rating ?? ""), 10);

    if (!restaurantName || Number.isNaN(ratingNumber)) {
      continue;
    }

    if (ratingNumber < 1 || ratingNumber > 10) {
      continue;
    }

    const stats = statsByRestaurant.get(normalizeRestaurantName(restaurantName));
    if (!stats) {
      continue;
    }

    stats.votes += 1;
    stats.histogram[ratingNumber - 1] += 1;
  }

  return initialStats;
}

function getAverageRating(stats: RestaurantStats): number {
  if (stats.votes === 0) {
    return 0;
  }

  const weightedSum = stats.histogram.reduce(
    (sum, count, index) => sum + count * (index + 1),
    0,
  );

  return weightedSum / stats.votes;
}

function AverageRatingByRestaurantChart({
  allStats,
}: {
  allStats: RestaurantStats[];
}) {
  const sortedStats = [...allStats].sort((a, b) => {
    const averageDiff = getAverageRating(b) - getAverageRating(a);
    if (averageDiff !== 0) {
      return averageDiff;
    }

    return b.votes - a.votes;
  });

  return (
    <section className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 via-yellow-50 to-amber-100 p-5 shadow-[0_20px_46px_-24px_rgba(202,138,4,0.55)] dark:border-amber-800/50 dark:from-amber-950/35 dark:via-yellow-950/25 dark:to-amber-900/20">
      <header className="mb-4 space-y-1">
        <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-200">
          Snittbetyg per restaurang
        </h2>
        <p className="text-sm text-amber-800 dark:text-amber-300">
          X-axel: restaurang. Y-axel: genomsnittligt betyg (0 till 10). Röster visas ovanför varje stapel.
        </p>
      </header>

      <div className="rounded-xl border border-amber-200/80 bg-linear-to-b from-amber-100 to-yellow-50 p-3 dark:border-amber-800/40 dark:from-amber-950/20 dark:to-yellow-950/10">
        <div className="grid h-96 grid-cols-8 items-end gap-1">
          {sortedStats.map((stats) => {
            const average = getAverageRating(stats);
            const heightPercent = (average / 10) * 100;

            return (
              <div
                key={stats.slug}
                className="flex h-full min-w-0 flex-col items-center"
                title={`${stats.name}: ${average.toFixed(1)} i snitt (${stats.votes} röster)`}
              >
                <div className="flex h-12 w-0 items-center justify-center">
                  <span className="inline-block -rotate-90 whitespace-nowrap text-center rounded-full bg-amber-200/80 px-2 py-0.5 text-[9px] font-semibold text-amber-900 dark:bg-amber-700/40 dark:text-amber-100">
                    {stats.votes} röster
                  </span>
                </div>
                <span className="w-full text-center text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {average.toFixed(1)}
                </span>
                <div className="flex flex-1 items-end py-2">
                  <div
                    className="w-7 rounded-t-md bg-linear-to-t from-amber-600 via-yellow-400 to-amber-200 shadow-[0_10px_18px_-10px_rgba(180,83,9,0.85)]"
                    style={{
                      height: `${Math.max(heightPercent, stats.votes > 0 ? 8 : 2)}%`,
                    }}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex h-20 w-0 items-center justify-center">
                  <span className="inline-block -rotate-90 whitespace-nowrap text-center text-[10px] font-medium leading-none text-amber-900 dark:text-amber-200">
                    {stats.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function StatisticsPage() {
  const [hydrated, setHydrated] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [apiReviews, setApiReviews] = useState<ApiReview[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedGroup = readActiveGroup();

      if (isGroupSlug(storedGroup)) {
        setIsUnlocked(hasCompletedAllVotes(storedGroup));
      }

      setHydrated(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !isUnlocked) {
      return;
    }

    let cancelled = false;

    const loadSharedStats = async () => {
      setLoadingStats(true);
      setStatsError(null);

      try {
        const headers: Record<string, string> = {};
        const directUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
        if (directUrl) {
          headers["x-apps-script-url"] = directUrl;
        }

        const response = await fetch("/api/reviews", {
          method: "GET",
          cache: "no-store",
          headers,
        });

        const payload = (await response.json()) as {
          ok?: boolean;
          error?: string;
          reviews?: ApiReview[];
        };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Kunde inte hämta statistik.");
        }

        if (!cancelled) {
          setApiReviews(Array.isArray(payload.reviews) ? payload.reviews : []);
        }
      } catch (error) {
        if (!cancelled) {
          setStatsError(
            error instanceof Error ? error.message : "Kunde inte hämta statistik.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingStats(false);
        }
      }
    };

    void loadSharedStats();

    return () => {
      cancelled = true;
    };
  }, [hydrated, isUnlocked]);

  const restaurantStats = useMemo(() => {
    if (!isUnlocked) {
      return [];
    }

    return buildRestaurantStats(apiReviews);
  }, [apiReviews, isUnlocked]);

  if (!hydrated) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Laddar statistik...</p>
      </main>
    );
  }

  if (!isUnlocked) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Statistik är låst
          </h1>
          <p className="mt-3 text-zinc-700 dark:text-zinc-300">
            Den här sidan blir synlig först när du har lämnat omdöme för alla tre restauranger i din grupp.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Till startsidan
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 bg-linear-to-b from-zinc-100 via-white to-zinc-100 px-4 py-8 sm:px-6 lg:px-8 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Statistik
        </h1>
        <p className="text-zinc-700 dark:text-zinc-300">
          Stapeldiagram över hur rösterna fördelar sig för varje restaurang, summerat för alla grupper.
        </p>
      </header>

      {loadingStats ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Hämtar statistik från Google Sheets...</p>
      ) : null}

      {statsError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          Kunde inte hämta statistik: {statsError}
        </section>
      ) : null}

      <AverageRatingByRestaurantChart allStats={restaurantStats} />

      <div className="flex justify-end">
        <Link
          href="/statistik/detaljer"
          className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Visa detaljerad statistik
        </Link>
      </div>
    </main>
  );
}
