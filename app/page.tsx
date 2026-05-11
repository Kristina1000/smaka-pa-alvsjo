import Image from "next/image";
import Link from "next/link";
import { allGroupDefinitions } from "@/lib/tour-data";

export default function Home() {
  const orderedGroups = allGroupDefinitions;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex justify-center">
        <Image
          src="/smaka-pa-alvsjo.jpg"
          alt="Smaka på Älvsjö"
          width={320}
          height={320}
          priority
          className="h-auto w-full max-w-xs rounded-3xl bg-white/90 p-2 shadow-md ring-1 ring-zinc-300 dark:bg-zinc-900/80 dark:ring-zinc-700"
        />
      </div>

      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Välkommen till Smaka på Älvsjö!
        </h1>
        <p className="max-w-2xl text-zinc-700 dark:text-zinc-300">
          Vandra mellan gruppernas cykelturer och restaurangsidor.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orderedGroups.map((group) => (
          <Link
            key={group.slug}
            href={`/grupper/${group.slug}`}
            className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-300">
              Grupp
            </p>
            <h2 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {group.name}
            </h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              Start vid Bromsvägen 46 med tre restaurangstopp
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
