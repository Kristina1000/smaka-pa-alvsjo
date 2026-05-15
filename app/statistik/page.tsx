"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readActiveGroup } from "@/components/save-group-to-storage";
import {
  allGroupDefinitions,
  getGroupRouteBySlug,
  restaurantsBySlug,
  type GroupSlug,
} from "@/lib/tour-data";
import {
  buildHistogram,
  hasSubmittedForRestaurant,
  readEntriesFromStorage,
} from "@/lib/vote-storage";

type RestaurantStats = {
  slug: string;
  name: string;
  votes: number;
  histogram: number[];
};

const ratingScale = Array.from({ length: 10 }, (_, index) => index + 1);

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

function buildRestaurantStats(groupSlug: GroupSlug): RestaurantStats[] {
  const groupRoute = getGroupRouteBySlug(groupSlug);
  if (!groupRoute) {
    return [];
  }

  return groupRoute.restaurants
    .map((restaurantRef) => {
      const restaurant = restaurantsBySlug[restaurantRef.slug];
      if (!restaurant) {
        return null;
      }

      const entries = readEntriesFromStorage(restaurant.slug);
      return {
        slug: restaurant.slug,
        name: restaurant.name,
        votes: entries.length,
        histogram: buildHistogram(entries),
      };
    })
    .filter((value): value is RestaurantStats => value !== null);
}

function RestaurantHistogram({ stats }: { stats: RestaurantStats }) {
  const maxVotes = Math.max(1, ...stats.histogram);

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {stats.name}
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Röster: <span className="font-semibold">{stats.votes}</span>
        </p>
      </header>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          Y-axel: antal röster
        </p>
        <div className="grid h-56 grid-cols-10 items-end gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
          {ratingScale.map((rating) => {
            const count = stats.histogram[rating - 1] ?? 0;
            const heightPercent = (count / maxVotes) * 100;

            return (
              <div key={rating} className="flex h-full flex-col items-center justify-end gap-1">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {count}
                </span>
                <div
                  className="w-full rounded-t bg-emerald-500 transition-[height]"
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

export default function StatisticsPage() {
  const [hydrated, setHydrated] = useState(false);
  const [activeGroupSlug, setActiveGroupSlug] = useState<GroupSlug | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedGroup = readActiveGroup();

      if (isGroupSlug(storedGroup)) {
        setActiveGroupSlug(storedGroup);
        setIsUnlocked(hasCompletedAllVotes(storedGroup));
      }

      setHydrated(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const restaurantStats = useMemo(() => {
    if (!activeGroupSlug || !isUnlocked) {
      return [];
    }

    return buildRestaurantStats(activeGroupSlug);
  }, [activeGroupSlug, isUnlocked]);

  if (!hydrated) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Laddar statistik...</p>
      </main>
    );
  }

  if (!activeGroupSlug || !isUnlocked) {
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
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Statistik
        </h1>
        <p className="text-zinc-700 dark:text-zinc-300">
          Stapeldiagram över hur rösterna fördelar sig för varje restaurang i din grupp.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-1">
        {restaurantStats.map((stats) => (
          <RestaurantHistogram key={stats.slug} stats={stats} />
        ))}
      </section>
    </main>
  );
}
