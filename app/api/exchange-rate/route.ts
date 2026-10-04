import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.frankfurter.dev/v2/rate/eur/usd",
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) throw new Error("Rate provider unavailable");
    const data = await response.json();
    if (
      data.base !== "EUR" ||
      data.quote !== "USD" ||
      !Number.isFinite(data.rate) ||
      data.rate <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.date)
    )
      throw new Error("Invalid exchange rate");
    return NextResponse.json(
      { usdPerEur: data.rate, date: data.date },
      {
        headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Exchange rate temporarily unavailable" },
      { status: 503 },
    );
  }
}
