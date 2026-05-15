import { NextResponse } from "next/server";

const SHEET_ID = "1i7Slkpl_aggiENivtayiQNc7SduBSQeWkcLzQpNM0EQ";
const SHEET_NAME = "Feedback";

type ReviewPayload = {
  timestamp?: string;
  group?: string;
  restaurantName?: string;
  rating?: number | string;
  comment?: string;
};

function normalizeReviews(payload: unknown): ReviewPayload[] {
  const list =
    Array.isArray(payload)
      ? payload
      : typeof payload === "object" && payload !== null
        ? ((payload as { reviews?: unknown; rows?: unknown; data?: unknown })
            .reviews ??
            (payload as { reviews?: unknown; rows?: unknown; data?: unknown })
              .rows ??
            (payload as { reviews?: unknown; rows?: unknown; data?: unknown })
              .data)
        : null;

  if (!Array.isArray(list)) {
    return [];
  }

  return list.reduce<ReviewPayload[]>((acc, item) => {
    if (typeof item !== "object" || item === null) {
      return acc;
    }

    const row = item as Record<string, unknown>;
    acc.push({
      timestamp:
        typeof row.timestamp === "string"
          ? row.timestamp
          : typeof row.Timestamp === "string"
            ? row.Timestamp
            : undefined,
      group:
        typeof row.group === "string"
          ? row.group
          : typeof row.Group === "string"
            ? row.Group
            : undefined,
      restaurantName:
        typeof row.restaurantName === "string"
          ? row.restaurantName
          : typeof row.restaurant === "string"
            ? row.restaurant
            : typeof row.Restaurant === "string"
              ? row.Restaurant
              : undefined,
      rating:
        typeof row.rating === "number" || typeof row.rating === "string"
          ? row.rating
          : typeof row.Rating === "number" || typeof row.Rating === "string"
            ? row.Rating
            : undefined,
      comment:
        typeof row.comment === "string"
          ? row.comment
          : typeof row.Comment === "string"
            ? row.Comment
            : undefined,
    });

    return acc;
  }, []);
}

function getAppsScriptUrl(request?: Request): string | null {
  const envUrl =
    process.env.APPS_SCRIPT_URL ?? process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

  if (envUrl) {
    return envUrl;
  }

  const headerUrl = request?.headers.get("x-apps-script-url") ?? null;
  if (!headerUrl) {
    return null;
  }

  try {
    const parsed = new URL(headerUrl);
    if (parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function parseGoogleVizResponse(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start < 0 || end < 0 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeReviewsFromSheet(payload: unknown): ReviewPayload[] {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const table = (payload as { table?: unknown }).table;
  if (typeof table !== "object" || table === null) {
    return [];
  }

  const rows = (table as { rows?: unknown }).rows;
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((row) => {
      if (typeof row !== "object" || row === null) {
        return null;
      }

      const cells = (row as { c?: unknown }).c;
      if (!Array.isArray(cells)) {
        return null;
      }

      const getCell = (index: number): unknown => {
        const cell = cells[index];
        if (typeof cell !== "object" || cell === null) {
          return undefined;
        }
        return (cell as { v?: unknown }).v;
      };

      return {
        timestamp: String(getCell(0) ?? ""),
        group: String(getCell(1) ?? ""),
        restaurantName: String(getCell(2) ?? ""),
        rating:
          typeof getCell(3) === "number"
            ? (getCell(3) as number)
            : String(getCell(3) ?? ""),
        comment: String(getCell(4) ?? ""),
      } as ReviewPayload;
    })
    .filter((row): row is ReviewPayload => row !== null);
}

async function fetchReviewsFromSheet(): Promise<ReviewPayload[]> {
  const queryUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
  const response = await fetch(queryUrl, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google Sheet responded with status ${response.status}`);
  }

  const text = await response.text();
  const parsed = parseGoogleVizResponse(text);
  return normalizeReviewsFromSheet(parsed);
}

export async function GET(request: Request) {
  try {
    const appsScriptUrl = getAppsScriptUrl(request);

    if (!appsScriptUrl) {
      try {
        const reviews = await fetchReviewsFromSheet();
        return NextResponse.json({ ok: true, reviews });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Apps Script URL is not configured.";

        return NextResponse.json(
          { ok: false, error: `Apps Script URL is not configured. ${message}` },
          { status: 500 },
        );
      }
    }

    const upstreamResponse = await fetch(appsScriptUrl, {
      method: "GET",
      cache: "no-store",
    });

    const upstreamText = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      try {
        const reviews = await fetchReviewsFromSheet();
        return NextResponse.json({ ok: true, reviews });
      } catch {
        return NextResponse.json(
          {
            ok: false,
            error: `Apps Script responded with status ${upstreamResponse.status}`,
            details: upstreamText,
          },
          { status: 502 },
        );
      }
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(upstreamText);
    } catch {
      parsed = null;
    }

    return NextResponse.json({
      ok: true,
      reviews: normalizeReviews(parsed),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? `${error.message}${
            error.cause instanceof Error
              ? ` | cause: ${error.cause.message}`
              : ""
          }`
        : "Unknown server error.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      timestamp?: string;
      group?: string;
      restaurantName?: string;
      rating?: number;
      comment?: string;
    };

    const appsScriptUrl = getAppsScriptUrl(request);

    if (!appsScriptUrl) {
      return NextResponse.json(
        { ok: false, error: "Apps Script URL is not configured." },
        { status: 500 },
      );
    }

    const upstreamResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const upstreamText = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Apps Script responded with status ${upstreamResponse.status}`,
          details: upstreamText,
        },
        { status: 502 },
      );
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(upstreamText);
    } catch {
      parsed = { raw: upstreamText };
    }

    return NextResponse.json({ ok: true, upstream: parsed });
  } catch (error) {
    const message =
      error instanceof Error
        ? `${error.message}${
            error.cause instanceof Error
              ? ` | cause: ${error.cause.message}`
              : ""
          }`
        : "Unknown server error.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
