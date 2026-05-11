import Link from "next/link";
import { notFound } from "next/navigation";
import { groupGul, restaurantsBySlug } from "@/lib/tour-data";
import RestaurantFeedbackForm from "@/components/restaurant-feedback-form";

type RestaurantPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return groupGul.restaurants.map((restaurant) => ({
    slug: restaurant.slug,
  }));
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const restaurant = restaurantsBySlug[slug];

  if (!restaurant) {
    notFound();
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    restaurant.address,
  )}`;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/grupper/gul"
        className="text-sm font-medium text-blue-700 hover:text-blue-800"
      >
        Tillbaka till Grupp Gul
      </Link>

      <header className="space-y-3">
        <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
          Grupp Gul
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          {restaurant.name}
        </h1>
        <p className="text-zinc-600">{restaurant.description}</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Adress</h2>
        <p className="mt-2 text-zinc-600">{restaurant.address}</p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          Oppna i Google Maps
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
