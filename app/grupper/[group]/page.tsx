import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BikeTourMap from "@/components/bike-tour-map";
import SaveGroupToStorage from "@/components/save-group-to-storage";
import GroupStatisticsLink from "@/components/group-statistics-link";
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

  const endDestinationRestaurant =
    groupRoute.endDestination.slug &&
    restaurantsBySlug[groupRoute.endDestination.slug];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
      <SaveGroupToStorage group={group} />
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <Image
            src="/smaka-pa-alvsjo.png"
            alt="Smaka på Älvsjö"
            width={96}
            height={96}
            className="h-auto w-20"
          />
          <h1
            className={`inline-flex rounded-full px-4 py-2 text-base font-semibold ${badgeStyle}`}
          >
            Grupp {groupRoute.name}
          </h1>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Här är era smakställen och er rutt!
        </h1>
        <p className="max-w-3xl text-zinc-800 dark:text-zinc-300">
          Klicka på siffrorna i kartan eller scrolla ner på sidan för att komma till varje smakstopp.
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
            {resolvedRestaurants.map(({ restaurant, ref }) => (
              <li key={restaurant.slug}>
                <Link
                  className="block space-y-1 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                  href={`/restauranger/${restaurant.slug}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-blue-800 dark:text-blue-400">
                        {restaurant.name}
                      </p>
                      <p className="text-sm text-zinc-800 dark:text-zinc-400">
                        {restaurant.address}
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${timeBadgeStyle}`}
                    >
                      {ref.visitTime}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
            {endDestinationRestaurant ? (
              <li key={endDestinationRestaurant.slug}>
                <Link
                  className="block space-y-1 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
                  href={`/restauranger/${endDestinationRestaurant.slug}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-blue-800 dark:text-blue-400">
                        {endDestinationRestaurant.name}
                      </p>
                      <p className="text-sm text-zinc-800 dark:text-zinc-400">
                        {endDestinationRestaurant.address}
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${timeBadgeStyle}`}
                    >
                      Mål
                    </span>
                  </div>
                </Link>
              </li>
            ) : null}
          </ol>
        </aside>
      </section>

      <GroupStatisticsLink groupSlug={group} />
    </main>
  );
}
