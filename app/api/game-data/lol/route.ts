import { lolChampions } from "@/data/lol-champions";

export async function GET() {
  try {
    const versionsResponse = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
      next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000),
    });
    if (!versionsResponse.ok) throw new Error("Versions unavailable");
    const versions: unknown = await versionsResponse.json();
    const version = Array.isArray(versions) ? versions[0] : null;
    if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Invalid version");
    const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`, {
      next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Champions unavailable");
    const payload = await response.json();
    const champions = Object.values(payload.data ?? {}).flatMap((entry) => {
      const item = entry as { id?: unknown; name?: unknown };
      return typeof item.id === "string" && /^[A-Za-z0-9]+$/.test(item.id) && typeof item.name === "string"
        ? [{ id: item.id, name: item.name }] : [];
    }).sort((a, b) => a.name.localeCompare(b.name));
    if (champions.length < lolChampions.length) throw new Error("Incomplete catalog");
    return Response.json({ champions, version, source: "riot" }, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return Response.json({ champions: lolChampions, version: "16.20.1", source: "fallback" }, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
