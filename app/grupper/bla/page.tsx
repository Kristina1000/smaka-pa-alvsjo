import Link from "next/link";
import BikeTourMap from "@/components/bike-tour-map";
import SaveGroupToStorage from "@/components/save-group-to-storage";
import { groupBla, restaurantsBySlug } from "@/lib/tour-data";

export const metadata = {
  title: "Grupp Blå | Smaka pa Alvsjo",
  description:
    "Cykeltur for Grupp Blå: Erssons (16:00), TESO Sushi & Ramen (16:45), La Casa de Planka (17:30).",
};

export default function GroupBlaPage() {
  const resolvedRestaurants = groupBla.restaurants
    .map((ref) => restaurantsBySlug[ref.slug])
    .filter(
      (r): r is (typeof restaurantsBySlug)[keyof typeof restaurantsBySlug] =>
        r !== undefined,
    );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SaveGroupToStorage group={groupBla.name} />
      <header className="space-y-3">
        <p className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-900">
          Grupp Blå
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Cykeltur mellan tre restauranger
        </h1>
        <p className="max-w-3xl text-zinc-600">
          Start vid {groupBla.startAddress}. Klicka pa markorerna i kartan for
          att oppna varje restaurangsida.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <BikeTourMap
          startAddress={groupBla.startAddress}
          startCoordinates={groupBla.startCoordinates}
          restaurants={resolvedRestaurants}
        />

        <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Stopp</h2>
          <ol className="mt-4 space-y-4">
            {resolvedRestaurants.map((restaurant, index) => {
              const restaurantRef = groupBla.restaurants[index];
              return (
                <li key={restaurant.slug} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-500">
                      Stopp {index + 1}
                    </p>
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {restaurantRef.visitTime}
                    </span>
                  </div>
                  <Link
                    className="text-base font-semibold text-blue-700 hover:text-blue-800"
                    href={`/restauranger/${restaurant.slug}`}
                  >
                    {restaurant.name}
                  </Link>
                  <p className="text-sm text-zinc-600">{restaurant.address}</p>
                </li>
              );
            })}
          </ol>
        </aside>
      </section>
    </main>
  );
}
