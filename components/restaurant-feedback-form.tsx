"use client";

import { FormEvent, useEffect, useState } from "react";
import { readActiveGroup } from "@/components/save-group-to-storage";
import {
  type FeedbackEntry,
  hasSubmittedForRestaurant,
  readEntriesFromStorage,
  storageKeyFor,
  submittedKeyFor,
} from "@/lib/vote-storage";

type RestaurantFeedbackFormProps = {
  restaurantSlug: string;
  restaurantName: string;
};

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
      throw new Error(apiPayload.error ?? "Okänt API-fel.");
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
    apiError = error instanceof Error ? error.message : "okänt API-fel";
  }

  // Final fallback for production/local mismatch cases.
  if (directUrl) {
    try {
      await sendDirect();
      return;
    } catch (error) {
      const directError =
        error instanceof Error ? error.message : "okänt direkt-fel";
      throw new Error(
        `Kunde inte skicka omdöme via API (${apiError}) eller direkt (${directError}).`,
      );
    }
  }

  throw new Error(`Kunde inte skicka omdöme via API: ${apiError}`);
}

export default function RestaurantFeedbackForm({
  restaurantSlug,
  restaurantName,
}: RestaurantFeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setEntries(readEntriesFromStorage(restaurantSlug));
      setHasSubmitted(hasSubmittedForRestaurant(restaurantSlug));
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [restaurantSlug]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedComment = comment.trim();

    if (hasSubmitted) {
      setStatusMessage(
        "Du har redan skickat ett omdöme för den här restaurangen.",
      );
      return;
    }

    if (rating === null) {
      setStatusMessage("Välj ett betyg mellan 1 och 10.");
      return;
    }

    if (rating < 1 || rating > 10) {
      setStatusMessage("Betyg måste vara mellan 1 och 10.");
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
      window.localStorage.setItem(submittedKeyFor(restaurantSlug), "true");
      setHasSubmitted(true);
    } catch {
      // localStorage not available
    }

    // Then send to Google Apps Script
    try {
      await postToAppsScript(nextEntry);
      setStatusMessage("Tack! Ditt omdöme är skickat.");
    } catch (error) {
      setStatusMessage(
        `Sparat lokalt, men kunde inte skicka till servern just nu: ${
          error instanceof Error ? error.message : "okänt fel"
        }`,
      );
    }

    setSubmitting(false);
    setRating(null);
    setComment("");
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Betyg och kommentar
      </h2>

      {hasSubmitted ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-200">
          Tack! Ditt omdöme är skickat.
        </div>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Totalbetyg (1-10)
            </legend>
            <div
              className="grid w-full grid-cols-10 gap-1 sm:gap-1.5"
              role="radiogroup"
              aria-label="Valj betyg mellan 1 och 10"
            >
              {Array.from({ length: 10 }, (_, index) => {
                const value = index + 1;
                const isSelected = (rating ?? 0) >= value;
                const isChecked = rating === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    role="radio"
                    aria-checked={isChecked}
                    aria-label={`${value} av 10`}
                    className={`inline-flex aspect-square w-full items-center justify-center rounded border text-xs leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 sm:text-sm dark:focus-visible:ring-offset-zinc-900 ${
                      isSelected
                        ? "border-amber-500 bg-amber-100 text-amber-700 dark:border-amber-400 dark:bg-amber-900/30 dark:text-amber-300"
                        : "border-zinc-300 bg-white text-zinc-400 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-700"
                    }`}
                  >
                    ★
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-zinc-800 dark:text-zinc-400">
              1 = sämst, 10 = bäst. Valt betyg: {rating ?? "-"}/10.
            </p>
          </fieldset>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Kommentar om besöket (valfritt)
            </span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400"
              placeholder="Hur var maten, servicen och stämningen?"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-50 dark:bg-amber-400 dark:hover:bg-amber-300"
          >
            {submitting ? "Skickar..." : "Skicka omdöme"}
          </button>

          {statusMessage ? (
            <p className="text-sm text-zinc-800 dark:text-zinc-300">{statusMessage}</p>
          ) : null}
        </form>
      )}

    </section>
  );
}
