import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      timestamp?: string;
      group?: string;
      restaurantName?: string;
      rating?: number;
      comment?: string;
    };

    const appsScriptUrl =
      process.env.APPS_SCRIPT_URL ?? process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

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
