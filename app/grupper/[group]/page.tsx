import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BikeTourMap from "@/components/bike-tour-map";
import SaveGroupToStorage from "@/components/save-group-to-storage";
import {
  allGroupDefinitions,
  groupThemeBySlug,
  getGroupRouteBySlug,
  restaurantsBySlug,
  type GroupSlug,
} from "@/lib/tour-data";

type GroupPageProps = {
  params: Promise<{ group: string }>;
};

function isGroupSlug(value: string): value is GroupSlug {
  return allGroupDefinitions.some((group) => group.slug === value);
}

export async function generateStaticParams() {
  return allGroupDefinitions.map((group) => ({
    group: group.slug,
  }));
}

export async function generateMetadata({
  params,
}: GroupPageProps): Promise<Metadata> {
  const { group } = await params;

  if (!isGroupSlug(group)) {
    return {
      title: "Grupp | Smaka på Älvsjö",
      description: "Gruppsida för cykelturen.",
    };
  }

  const groupRoute = getGroupRouteBySlug(group);
  if (!groupRoute) {
    return {
      title: "Grupp | Smaka på Älvsjö",
      description: "Gruppsida för cykelturen.",
    };
  }

  const stops = groupRoute.restaurants
    .map((ref) => {
      const restaurant = restaurantsBySlug[ref.slug];
      return restaurant ? `${restaurant.name} (${ref.visitTime})` : null;
    })
    .filter((value): value is string => value !== null)
    .join(", ");

  return {
    title: `Grupp ${groupRoute.name} | Smaka på Älvsjö`,
    description: `Cykeltur för grupp ${groupRoute.name}: ${stops}.`,
  };
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { group } = await params;

  if (!isGroupSlug(group)) {
    notFound();
  }

  const groupRoute = getGroupRouteBySlug(group);
  if (!groupRoute) {
    notFound();
  }

  const resolvedRestaurants = groupRoute.restaurants
    .map((ref) => ({ restaurant: restaurantsBySlug[ref.slug], ref }))
    .filter(
      (
        item,
      ): item is {
        restaurant: (typeof restaurantsBySlug)[keyof typeof restaurantsBySlug];
        ref: (typeof groupRoute.restaurants)[number];
      } => item.restaurant !== undefined,
    );

  const groupTheme = groupThemeBySlug[group];
  const badgeStyle = groupTheme.headerBadgeClassName;
  const timeBadgeStyle = groupTheme.timeBadgeClassName;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex justify-center mb-2">
        <Image
          src="/smaka-pa-alvsjo.png"
          alt="Smaka på Älvsjö"
          width={100}
          height={100}
          className="w-1/3 h-auto"
        />
      </div>
      <SaveGroupToStorage group={groupRoute.name} />
      <header className="space-y-3">
        <h1
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${badgeStyle}`}
        >
          Grupp {groupRoute.name}
        </h1>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Cykeltur mellan tre restauranger
        </h1>
        <p className="max-w-3xl text-zinc-800 dark:text-zinc-300">
          Start vid {groupRoute.startAddress}. Klicka på markörerna i kartan för
          att öppna varje restaurangsida.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <BikeTourMap
          startAddress={groupRoute.startAddress}
          startCoordinates={groupRoute.startCoordinates}
          endDestination={groupRoute.endDestination}
          restaurants={resolvedRestaurants.map((item) => item.restaurant)}
        />

        <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Stopp
          </h2>
          <ol className="mt-4 space-y-4">
            {resolvedRestaurants.map(({ restaurant, ref }, index) => (
              <li key={restaurant.slug}>
                <Link
                  className="block space-y-1 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                  href={`/restauranger/${restaurant.slug}?group=${group}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-400">
                      Stopp {index + 1}
                    </p>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${timeBadgeStyle}`}
                    >
                      {ref.visitTime}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-blue-800 dark:text-blue-400">
                    {restaurant.name}
                  </p>
                  <p className="text-sm text-zinc-800 dark:text-zinc-400">
                    {restaurant.address}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Mål
            </p>
            <p className="text-sm text-zinc-800 dark:text-zinc-300">
              {groupRoute.endDestination.name}
            </p>
            <p className="text-xs text-zinc-700 dark:text-zinc-400">
              Ingen fast tid
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
