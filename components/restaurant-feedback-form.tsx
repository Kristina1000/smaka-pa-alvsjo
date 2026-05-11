"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { readActiveGroup } from "@/components/save-group-to-storage";

type FeedbackEntry = {
  id: string;
  group: string;
  restaurantName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type RestaurantFeedbackFormProps = {
  restaurantSlug: string;
  restaurantName: string;
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

async function postToAppsScript(entry: FeedbackEntry): Promise<void> {
  const payload = {
    timestamp: entry.createdAt,
    group: entry.group,
    restaurantName: entry.restaurantName,
    rating: entry.rating,
    comment: entry.comment,
  };

  const directUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

  const sendViaApi = async (): Promise<void> => {
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`API-fel (${response.status}): ${responseText}`);
    }

    const apiPayload = (await response.json()) as {
      ok?: boolean;
      error?: string;
    };

    if (!apiPayload.ok) {
      throw new Error(apiPayload.error ?? "Okant API-fel.");
    }
  };

  const sendDirect = async (): Promise<void> => {
    if (!directUrl) {
      throw new Error("NEXT_PUBLIC_APPS_SCRIPT_URL saknas.");
    }

    const directResponse = await fetch(directUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
      mode: "no-cors",
    });

    if (!directResponse.ok && directResponse.type !== "opaque") {
      throw new Error("Direkt anrop till Apps Script misslyckades.");
    }
  };

  // In development, prefer browser-direct submission to avoid local Node TLS
  // certificate issues when calling external HTTPS endpoints.
  if (process.env.NODE_ENV === "development" && directUrl) {
    try {
      await sendDirect();
      return;
    } catch {
      // fall through to API path as backup
    }
  }

  let apiError: string | null = null;
  try {
    await sendViaApi();
    return;
  } catch (error) {
    apiError = error instanceof Error ? error.message : "okant API-fel";
  }

  // Final fallback for production/local mismatch cases.
  if (directUrl) {
    try {
      await sendDirect();
      return;
    } catch (error) {
      const directError =
        error instanceof Error ? error.message : "okant direkt-fel";
      throw new Error(
        `Kunde inte skicka omdome via API (${apiError}) eller direkt (${directError}).`,
      );
    }
  }

  throw new Error(`Kunde inte skicka omdome via API: ${apiError}`);
}

export default function RestaurantFeedbackForm({
  restaurantSlug,
  restaurantName,
}: RestaurantFeedbackFormProps) {
  const [rating, setRating] = useState<number>(7);
  const [comment, setComment] = useState("");
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setEntries(readEntriesFromStorage(restaurantSlug));
      setIsHydrated(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [restaurantSlug]);

  const averageRating = useMemo(() => {
    if (!entries.length) {
      return null;
    }
    const total = entries.reduce((sum, entry) => sum + entry.rating, 0);
    return (total / entries.length).toFixed(1);
  }, [entries]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    const group = readActiveGroup();

    const nextEntry: FeedbackEntry = {
      id: crypto.randomUUID(),
      group,
      restaurantName,
      rating,
      comment: trimmedComment,
      createdAt: new Date().toISOString(),
    };

    setSubmitting(true);
    setStatusMessage(null);

    // Save locally first so the entry is never lost
    const nextEntries = [nextEntry, ...entries];
    setEntries(nextEntries);
    try {
      window.localStorage.setItem(
        storageKeyFor(restaurantSlug),
        JSON.stringify(nextEntries),
      );
    } catch {
      // localStorage not available
    }

    // Then send to Google Apps Script
    try {
      await postToAppsScript(nextEntry);
      setStatusMessage("Tack! Ditt omdome ar skickat.");
    } catch (error) {
      setStatusMessage(
        `Sparat lokalt, men kunde inte skicka till servern just nu: ${
          error instanceof Error ? error.message : "okant fel"
        }`,
      );
    }

    setSubmitting(false);
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
          disabled={submitting}
          className="inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
        >
          {submitting ? "Skickar..." : "Skicka omdome"}
        </button>

        {statusMessage ? (
          <p className="text-sm text-zinc-700">{statusMessage}</p>
        ) : null}
      </form>

      <div className="mt-6 space-y-3">
        <h3 className="text-base font-semibold text-zinc-900">
          Tidigare omdomen
        </h3>
        {!isHydrated ? (
          <p className="text-sm text-zinc-600">Laddar omdomen...</p>
        ) : entries.length ? (
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
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900">
                  Betyg: {entry.rating}/10
                </p>
                {entry.group ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                    {entry.group}
                  </span>
                ) : null}
              </div>
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
