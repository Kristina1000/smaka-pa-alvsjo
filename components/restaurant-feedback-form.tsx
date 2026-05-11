"use client";

import { FormEvent, useMemo, useState } from "react";

type FeedbackEntry = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type RestaurantFeedbackFormProps = {
  restaurantSlug: string;
};

const storageKeyFor = (restaurantSlug: string) =>
  `smaka-feedback-${restaurantSlug}`;

function readEntriesFromStorage(restaurantSlug: string): FeedbackEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKeyFor(restaurantSlug));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as FeedbackEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function RestaurantFeedbackForm({
  restaurantSlug,
}: RestaurantFeedbackFormProps) {
  const [rating, setRating] = useState<number>(7);
  const [comment, setComment] = useState("");
  const [entries, setEntries] = useState<FeedbackEntry[]>(() =>
    readEntriesFromStorage(restaurantSlug),
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const averageRating = useMemo(() => {
    if (!entries.length) {
      return null;
    }

    const total = entries.reduce((sum, entry) => sum + entry.rating, 0);
    return (total / entries.length).toFixed(1);
  }, [entries]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setStatusMessage("Kommentaren kan inte vara tom.");
      return;
    }

    if (rating < 1 || rating > 10) {
      setStatusMessage("Betyg maste vara mellan 1 och 10.");
      return;
    }

    const nextEntry: FeedbackEntry = {
      id: crypto.randomUUID(),
      rating,
      comment: trimmedComment,
      createdAt: new Date().toISOString(),
    };

    const nextEntries = [nextEntry, ...entries];
    setEntries(nextEntries);

    try {
      window.localStorage.setItem(
        storageKeyFor(restaurantSlug),
        JSON.stringify(nextEntries),
      );
      setStatusMessage("Tack! Ditt betyg ar sparat.");
    } catch {
      setStatusMessage("Kunde inte spara lokalt i den har webblasaren.");
    }

    setRating(7);
    setComment("");
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">
        Betyg och kommentar
      </h2>

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-800">
            Betyg (1-10)
          </span>
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
            className="w-28 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-800">
            Kommentar om besoket
          </span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
            placeholder="Hur var maten, servicen och stamningen?"
            required
          />
        </label>

        <button
          type="submit"
          className="inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-400"
        >
          Skicka omdome
        </button>

        {statusMessage ? (
          <p className="text-sm text-zinc-700">{statusMessage}</p>
        ) : null}
      </form>

      <div className="mt-6 space-y-3">
        <h3 className="text-base font-semibold text-zinc-900">
          Tidigare omdomen
        </h3>
        {entries.length ? (
          <p className="text-sm text-zinc-600">
            {entries.length} omdomen, snittbetyg: {averageRating}
          </p>
        ) : (
          <p className="text-sm text-zinc-600">Inga omdomen an sa lange.</p>
        )}

        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-zinc-200 p-3"
            >
              <p className="text-sm font-semibold text-zinc-900">
                Betyg: {entry.rating}/10
              </p>
              <p className="mt-1 text-sm text-zinc-700">{entry.comment}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {new Date(entry.createdAt).toLocaleString("sv-SE")}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
