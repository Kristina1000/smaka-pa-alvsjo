"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/loading-spinner";
import { allRestaurants } from "@/lib/tour-data";

type ApiReview = {
  id: string;
  timestamp?: string;
  group?: string;
  restaurantName?: string;
  rating?: number | string;
  comment?: string;
};

function normalizeRestaurantName(value: string): string {
  return value.trim().toLowerCase();
}

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

  const [entries, setEntries] = useState<ApiReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [hasLoadedReviews, setHasLoadedReviews] = useState(false);

  const restaurant = allRestaurants.find((r) => r.slug === restaurantSlug);

  useEffect(() => {
    if (typeof restaurantSlug !== "string" || !restaurant) {
      return;
    }

    let cancelled = false;

    const loadReviews = async () => {
      setLoadingReviews(true);
      setReviewsError(null);

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
          throw new Error(payload.error ?? "Kunde inte hämta recensioner.");
        }

        const filtered = (Array.isArray(payload.reviews) ? payload.reviews : [])
          .filter((review) => {
            const name =
              typeof review.restaurantName === "string" ? review.restaurantName : "";
            return (
              normalizeRestaurantName(name) ===
              normalizeRestaurantName(restaurant.name)
            );
          })
          .filter((review) => {
            const ratingNumber =
              typeof review.rating === "number"
                ? review.rating
                : Number.parseInt(String(review.rating ?? ""), 10);
            return !Number.isNaN(ratingNumber) && ratingNumber >= 1 && ratingNumber <= 10;
          })
          .map((review, index) => ({
            ...review,
            id:
              typeof review.id === "string" && review.id.length > 0
                ? review.id
                : `${review.timestamp ?? "no-ts"}-${index}`,
          }))
          .sort((a, b) => {
            const aTime = Date.parse(String(a.timestamp ?? ""));
            const bTime = Date.parse(String(b.timestamp ?? ""));
            if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
              return 0;
            }
            return bTime - aTime;
          });

        if (!cancelled) {
          setEntries(filtered);
          setHasLoadedReviews(true);
        }
      } catch (error) {
        if (!cancelled) {
          setReviewsError(
            error instanceof Error
              ? error.message
              : "Kunde inte hämta recensioner.",
          );
          setHasLoadedReviews(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingReviews(false);
        }
      }
    };

    void loadReviews();
    const refreshIntervalId = window.setInterval(() => {
      void loadReviews();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshIntervalId);
    };
  }, [restaurant, restaurantSlug]);

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
          Visar alla inkomna omdömen med betyg och kommentarer.
        </p>
      </header>

      {loadingReviews && !hasLoadedReviews ? (
        <LoadingSpinner label="Hämtar recensioner..." />
      ) : null}

      {reviewsError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          Kunde inte hämta recensioner: {reviewsError}
        </section>
      ) : null}

      {hasLoadedReviews && entries.length === 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          Inga omdömen hittades för den här restaurangen ännu.
        </section>
      ) : hasLoadedReviews ? (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <RatingStars
                  rating={
                    typeof entry.rating === "number"
                      ? entry.rating
                      : Number.parseInt(String(entry.rating ?? ""), 10)
                  }
                />
              </p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                Betyg: {entry.rating}/10
              </p>
              {typeof entry.comment === "string" && entry.comment.trim() ? (
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  Kommentar: {entry.comment}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}