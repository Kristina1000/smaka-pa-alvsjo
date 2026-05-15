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
import { hasSubmittedForRestaurant } from "@/lib/vote-storage";

type RestaurantStats = {
  slug: string;
  name: string;
  votes: number;
  histogram: number[];
};

type RestaurantTheme = {
  cardGradient: string;
  cardBorder: string;
  cardShadow: string;
  barGradient: string;
  barShadow: string;
  axisGradient: string;
  accentText: string;
};

type ApiReview = {
  restaurantName?: string;
  rating?: number | string;
};

const ratingScale = Array.from({ length: 10 }, (_, index) => index + 1);

const defaultTheme: RestaurantTheme = {
  cardGradient: "bg-linear-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800",
  cardBorder: "border-zinc-200 dark:border-zinc-700",
  cardShadow: "shadow-[0_18px_40px_-22px_rgba(15,23,42,0.45)]",
  barGradient: "bg-linear-to-t from-zinc-500 to-zinc-300",
  barShadow: "shadow-[0_8px_16px_-8px_rgba(63,63,70,0.8)]",
  axisGradient: "bg-linear-to-b from-zinc-100 to-zinc-50 dark:from-zinc-800/80 dark:to-zinc-900/80",
  accentText: "text-zinc-800 dark:text-zinc-200",
};

const restaurantThemes: Record<string, RestaurantTheme> = {
  "casa-del-planka": {
    cardGradient: "bg-linear-to-br from-orange-50 via-amber-50 to-yellow-100 dark:from-orange-950/40 dark:via-amber-950/30 dark:to-yellow-950/20",
    cardBorder: "border-orange-200 dark:border-orange-900/40",
    cardShadow: "shadow-[0_20px_46px_-24px_rgba(234,88,12,0.55)]",
    barGradient: "bg-linear-to-t from-orange-600 to-amber-300",
    barShadow: "shadow-[0_10px_18px_-10px_rgba(234,88,12,0.9)]",
    axisGradient: "bg-linear-to-b from-orange-100 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20",
    accentText: "text-orange-900 dark:text-orange-200",
  },
  erssons: {
    cardGradient: "bg-linear-to-br from-cyan-50 via-sky-50 to-blue-100 dark:from-cyan-950/40 dark:via-sky-950/30 dark:to-blue-950/20",
    cardBorder: "border-cyan-200 dark:border-cyan-900/40",
    cardShadow: "shadow-[0_20px_46px_-24px_rgba(6,182,212,0.5)]",
    barGradient: "bg-linear-to-t from-cyan-600 to-sky-300",
    barShadow: "shadow-[0_10px_18px_-10px_rgba(8,145,178,0.9)]",
    axisGradient: "bg-linear-to-b from-cyan-100 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/20",
    accentText: "text-cyan-900 dark:text-cyan-200",
  },
  teso: {
    cardGradient: "bg-linear-to-br from-rose-50 via-pink-50 to-fuchsia-100 dark:from-rose-950/40 dark:via-pink-950/30 dark:to-fuchsia-950/20",
    cardBorder: "border-rose-200 dark:border-rose-900/40",
    cardShadow: "shadow-[0_20px_46px_-24px_rgba(244,63,94,0.5)]",
    barGradient: "bg-linear-to-t from-rose-600 to-pink-300",
    barShadow: "shadow-[0_10px_18px_-10px_rgba(225,29,72,0.9)]",
    axisGradient: "bg-linear-to-b from-rose-100 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20",
    accentText: "text-rose-900 dark:text-rose-200",
  },
  "var-pizza": {
    cardGradient: "bg-linear-to-br from-red-50 via-orange-50 to-amber-100 dark:from-red-950/40 dark:via-orange-950/30 dark:to-amber-950/20",
    cardBorder: "border-red-200 dark:border-red-900/40",
    cardShadow: "shadow-[0_20px_46px_-24px_rgba(239,68,68,0.5)]",
    barGradient: "bg-linear-to-t from-red-600 to-orange-300",
    barShadow: "shadow-[0_10px_18px_-10px_rgba(220,38,38,0.9)]",
    axisGradient: "bg-linear-to-b from-red-100 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20",
    accentText: "text-red-900 dark:text-red-200",
  },
  kottverket: {
    cardGradient: "bg-linear-to-br from-stone-100 via-amber-50 to-orange-100 dark:from-stone-900 dark:via-amber-950/20 dark:to-orange-950/20",
    cardBorder: "border-stone-300 dark:border-stone-700",
    cardShadow: "shadow-[0_20px_46px_-24px_rgba(120,53,15,0.45)]",
    barGradient: "bg-linear-to-t from-stone-700 to-amber-300",
    barShadow: "shadow-[0_10px_18px_-10px_rgba(68,64,60,0.9)]",
    axisGradient: "bg-linear-to-b from-stone-100 to-amber-50 dark:from-stone-900/70 dark:to-amber-950/20",
    accentText: "text-stone-900 dark:text-stone-200",
  },
  rinos: {
    cardGradient: "bg-linear-to-br from-violet-50 via-fuchsia-50 to-indigo-100 dark:from-violet-950/40 dark:via-fuchsia-950/25 dark:to-indigo-950/20",
    cardBorder: "border-violet-200 dark:border-violet-900/40",
    cardShadow: "shadow-[0_20px_46px_-24px_rgba(139,92,246,0.5)]",
    barGradient: "bg-linear-to-t from-violet-600 to-fuchsia-300",
    barShadow: "shadow-[0_10px_18px_-10px_rgba(124,58,237,0.9)]",
    axisGradient: "bg-linear-to-b from-violet-100 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/20",
    accentText: "text-violet-900 dark:text-violet-200",
  },
  beirut: {
    cardGradient: "bg-linear-to-br from-lime-50 via-emerald-50 to-green-100 dark:from-lime-950/30 dark:via-emerald-950/25 dark:to-green-950/20",
    cardBorder: "border-lime-200 dark:border-lime-900/40",
    cardShadow: "shadow-[0_20px_46px_-24px_rgba(132,204,22,0.5)]",
    barGradient: "bg-linear-to-t from-lime-600 to-emerald-300",
    barShadow: "shadow-[0_10px_18px_-10px_rgba(101,163,13,0.85)]",
    axisGradient: "bg-linear-to-b from-lime-100 to-emerald-50 dark:from-lime-950/30 dark:to-emerald-950/20",
    accentText: "text-lime-900 dark:text-lime-200",
  },
  "herrangens-gard": {
    cardGradient: "bg-linear-to-br from-blue-50 via-sky-50 to-cyan-100 dark:from-blue-950/35 dark:via-sky-950/30 dark:to-cyan-950/20",
    cardBorder: "border-blue-200 dark:border-blue-900/40",
    cardShadow: "shadow-[0_20px_46px_-24px_rgba(59,130,246,0.5)]",
    barGradient: "bg-linear-to-t from-blue-600 to-cyan-300",
    barShadow: "shadow-[0_10px_18px_-10px_rgba(37,99,235,0.9)]",
    axisGradient: "bg-linear-to-b from-blue-100 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20",
    accentText: "text-blue-900 dark:text-blue-200",
  },
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

function RestaurantHistogram({ stats }: { stats: RestaurantStats }) {
  const maxVotes = Math.max(1, ...stats.histogram);
  const theme = restaurantThemes[stats.slug] ?? defaultTheme;

  return (
    <article
      className={`rounded-2xl border p-5 ${theme.cardGradient} ${theme.cardBorder} ${theme.cardShadow}`}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className={`text-lg font-semibold ${theme.accentText}`}>
          {stats.name}
        </h2>
        <p className={`text-sm ${theme.accentText}`}>
          Röster: <span className="font-semibold">{stats.votes}</span>
        </p>
      </header>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Y-axel: antal röster
        </p>
        <div
          className={`grid h-56 grid-cols-10 items-end gap-2 rounded-lg border p-3 ${theme.cardBorder} ${theme.axisGradient}`}
        >
          {ratingScale.map((rating) => {
            const count = stats.histogram[rating - 1] ?? 0;
            const heightPercent = (count / maxVotes) * 100;

            return (
              <div key={rating} className="flex h-full flex-col items-center justify-end gap-1">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {count}
                </span>
                <div
                  className={`w-full rounded-t transition-[height] ${theme.barGradient} ${theme.barShadow}`}
                  style={{
                    height: `${Math.max(heightPercent, count > 0 ? 8 : 2)}%`,
                  }}
                  aria-hidden="true"
                />
                <span className="text-xs text-zinc-600 dark:text-zinc-400">{rating}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          X-axel: betyg 1 till 10
        </p>
      </div>
    </article>
  );
}

export default function StatisticsDetailsPage() {
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Statistikdetaljer
          </h1>
          <Link
            href="/statistik"
            className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Tillbaka till översikt
          </Link>
        </div>
        <p className="text-zinc-700 dark:text-zinc-300">
          Stapeldiagram över hur rösterna fördelar sig per betyg för varje restaurang.
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

      <section className="grid gap-5 md:grid-cols-1">
        {restaurantStats.map((stats) => (
          <RestaurantHistogram key={stats.slug} stats={stats} />
        ))}
      </section>
    </main>
  );
}
