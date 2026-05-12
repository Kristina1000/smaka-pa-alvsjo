import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allGroupDefinitions,
  allRestaurants,
  restaurantsBySlug,
} from "@/lib/tour-data";
import RestaurantFeedbackForm from "@/components/restaurant-feedback-form";

type RestaurantPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ group?: string | string[] }>;
};

export async function generateStaticParams() {
  return allRestaurants.map((restaurant) => ({
    slug: restaurant.slug,
  }));
}

import Image from "next/image";

export default async function RestaurantPage({
  params,
  searchParams,
}: RestaurantPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const restaurant = restaurantsBySlug[slug];

  if (!restaurant) {
    notFound();
  }

  const requestedGroup =
    typeof query.group === "string"
      ? query.group
      : Array.isArray(query.group)
        ? query.group[0]
        : undefined;

  const activeGroup = allGroupDefinitions.find(
    (group) => group.slug === requestedGroup,
  );

  const backGroupSlug = activeGroup?.slug ?? "gul";
  const backGroupName = activeGroup?.name ?? "Gul";

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    restaurant.address,
  )}`;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex justify-center mb-2">
        <Image
          src="/smaka-pa-alvsjo.png"
          alt="Smaka på Älvsjö"
          width={100}
          height={100}
          className="w-1/3 h-auto"
        />
      </div>
      <Link
        href={`/grupper/${backGroupSlug}`}
        className="text-sm font-medium text-blue-800 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
      >
        Tillbaka till Grupp {backGroupName}
      </Link>

      <header className="space-y-3">
        <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900 dark:bg-amber-900/30 dark:text-amber-300">
          Grupp {backGroupName}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {restaurant.name}
        </h1>
        <p className="text-zinc-800 dark:text-zinc-300">{restaurant.description}</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Adress</h2>
        <p className="mt-2 text-zinc-800 dark:text-zinc-300">{restaurant.address}</p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Öppna i Google Maps
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
