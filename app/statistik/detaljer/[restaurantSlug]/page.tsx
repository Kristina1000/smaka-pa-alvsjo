"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { allRestaurants } from "@/lib/tour-data";
import { type FeedbackEntry, readEntriesFromStorage } from "@/lib/vote-storage";

function RatingStars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} av 10 stjärnor`} role="img">
      {Array.from({ length: 10 }, (_, index) => {
        const value = index + 1;
        const isFilled = value <= rating;

        return (
          <span
            key={value}
            className={isFilled ? "text-amber-500" : "text-zinc-300 dark:text-zinc-600"}
          >
            ★
          </span>
        );
      })}
    </span>
  );
}

export default function RestaurantDetailsPage() {
  const params = useParams<{ restaurantSlug: string }>();
  const restaurantSlug = params?.restaurantSlug;

  const [entries, setEntries] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    if (typeof restaurantSlug === "string") {
      setEntries(readEntriesFromStorage(restaurantSlug));
    }
  }, [restaurantSlug]);

  const restaurant = allRestaurants.find((r) => r.slug === restaurantSlug);

  if (!restaurant) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-zinc-700 dark:text-zinc-300">Restaurangen hittades inte.</p>
        <Link
          href="/statistik/detaljer"
          className="inline-flex w-fit rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Tillbaka till statistikdetaljer
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <Link
          href="/statistik/detaljer"
          className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Tillbaka till statistikdetaljer
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {restaurant.name}
        </h1>
        <p className="text-zinc-700 dark:text-zinc-300">
          Visar alla sparade omdomen med betyg och kommentarer.
        </p>
      </header>

      {entries.length === 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          Inga omdömen hittades för den här restaurangen ännu.
        </section>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <RatingStars rating={entry.rating} />
              </p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                Betyg: {entry.rating}/10
              </p>
              {entry.comment ? (
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  Kommentar: {entry.comment}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}