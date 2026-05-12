import { notFound } from "next/navigation";
import {
  allRestaurants,
  restaurantsBySlug,
} from "@/lib/tour-data";
import RestaurantActiveGroupBadge from "@/components/restaurant-active-group-badge";
import RestaurantFeedbackForm from "@/components/restaurant-feedback-form";

type RestaurantPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return allRestaurants.map((restaurant) => ({
    slug: restaurant.slug,
  }));
}

import Image from "next/image";

export default async function RestaurantPage({
  params,
}: RestaurantPageProps) {
  const { slug } = await params;
  const restaurant = restaurantsBySlug[slug];

  if (!restaurant) {
    notFound();
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    restaurant.address,
  )}&travelmode=bicycling`;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Image
            src="/smaka-pa-alvsjo.png"
            alt="Smaka på Älvsjö"
            width={96}
            height={96}
            className="h-auto w-20"
          />
          <RestaurantActiveGroupBadge fallbackGroupSlug="gul" />
        </div>
        {restaurant.url ? (
          <a
            href={restaurant.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            {restaurant.name}
            <span aria-hidden="true" className="text-lg">
              ↗
            </span>
          </a>
        ) : (
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {restaurant.name}
          </h1>
        )}
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
       <p className="text-zinc-800 dark:text-zinc-300">{restaurant.description}</p>
         <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Vägbeskrivning
        </a>
      </section>

      <RestaurantFeedbackForm
        key={restaurant.slug}
        restaurantSlug={restaurant.slug}
        restaurantName={restaurant.name}
      />
    </main>
  );
}
