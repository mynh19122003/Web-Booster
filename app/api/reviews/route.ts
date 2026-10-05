import { reviews } from "@/data/reviews";

const DEFAULT_PAGE_SIZE = 4;
const MAX_PAGE_SIZE = 8;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawCursor = Number(url.searchParams.get("cursor") ?? 0);
  const rawLimit = Number(url.searchParams.get("limit") ?? DEFAULT_PAGE_SIZE);

  if (
    !Number.isInteger(rawCursor) ||
    rawCursor < 0 ||
    !Number.isInteger(rawLimit) ||
    rawLimit < 1
  ) {
    return Response.json({ error: "Invalid review page." }, { status: 400 });
  }

  const cursor = Math.min(rawCursor, reviews.length);
  const limit = Math.min(rawLimit, MAX_PAGE_SIZE);
  const items = reviews.slice(cursor, cursor + limit);
  const nextCursor =
    cursor + items.length < reviews.length ? cursor + items.length : null;

  return Response.json(
    { items, nextCursor, total: reviews.length },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
