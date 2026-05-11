import Link from "next/link";
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
      title: "Grupp | Smaka pa Alvsjo",
      description: "Gruppsida for cykelturen.",
    };
  }

  const groupRoute = getGroupRouteBySlug(group);
  if (!groupRoute) {
    return {
      title: "Grupp | Smaka pa Alvsjo",
      description: "Gruppsida for cykelturen.",
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
    title: `Grupp ${groupRoute.name} | Smaka pa Alvsjo`,
    description: `Cykeltur for Grupp ${groupRoute.name}: ${stops}.`,
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
      <SaveGroupToStorage group={groupRoute.name} />
      <header className="space-y-3">
        <h1
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${badgeStyle}`}
        >
          Grupp {groupRoute.name}
        </h1>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <BikeTourMap
          startAddress={groupRoute.startAddress}
          startCoordinates={groupRoute.startCoordinates}
          endDestination={groupRoute.endDestination}
          restaurants={resolvedRestaurants.map((item) => item.restaurant)}
        />

        <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Stopp</h2>
          <ol className="mt-4 space-y-4">
            {resolvedRestaurants.map(({ restaurant, ref }, index) => (
              <li key={restaurant.slug} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-500">
                    Stopp {index + 1}
                  </p>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${timeBadgeStyle}`}
                  >
                    {ref.visitTime}
                  </span>
                </div>
                <Link
                  className="text-base font-semibold text-blue-700 hover:text-blue-800"
                  href={`/restauranger/${restaurant.slug}?group=${group}`}
                >
                  {restaurant.name}
                </Link>
                <p className="text-sm text-zinc-600">{restaurant.address}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-sm font-semibold text-zinc-700">Mal</p>
            <p className="text-sm text-zinc-600">
              {groupRoute.endDestination.name}
            </p>
            <p className="text-xs text-zinc-500">Ingen fast tid</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
