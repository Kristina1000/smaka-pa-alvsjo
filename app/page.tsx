import Image from "next/image";
import Link from "next/link";
import { allGroupDefinitions } from "@/lib/tour-data";

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  gul: { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-900 dark:text-amber-300" },
  rosa: { border: "border-pink-200", bg: "bg-pink-50", text: "text-pink-900 dark:text-pink-300" },
  rod: { border: "border-red-200", bg: "bg-red-50", text: "text-red-900 dark:text-red-300" },
  gron: { border: "border-green-200", bg: "bg-green-50", text: "text-green-900 dark:text-green-300" },
  silver: { border: "border-zinc-300", bg: "bg-zinc-100", text: "text-zinc-900 dark:text-zinc-300" },
  bla: { border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-900 dark:text-blue-300" },
  vit: { border: "border-zinc-300", bg: "bg-zinc-50", text: "text-zinc-900 dark:text-zinc-700" },
};

export default function Home() {
  const orderedGroups = allGroupDefinitions;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex justify-center">
        <Image
          src="/smaka-pa-alvsjo.png"
          alt="Smaka på Älvsjö"
          width={320}
          height={320}
          priority
          className="h-auto w-full sm:max-w-xs p-2"
        />
      </div>

      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Välkommen till Smaka på Älvsjö!
        </h1>
          <p className="max-w-2xl text-zinc-900 dark:text-zinc-300">
          Vandra mellan gruppernas cykelturer och restaurangsidor.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orderedGroups.map((group) => {
          const colors = colorMap[group.slug] || colorMap.gul;
          return (
            <Link
              key={group.slug}
              href={`/grupper/${group.slug}`}
              className={`rounded-2xl border ${colors.border} ${colors.bg} p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900`}
            >
              <p className={`text-sm font-semibold uppercase tracking-wide ${colors.text}`}>
                Grupp
              </p>
              <h2 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {group.name}
              </h2>
                <p className="mt-2 text-sm text-zinc-900 dark:text-zinc-300">
                Start vid Bromsvägen 46 med tre restaurangstopp
              </p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
