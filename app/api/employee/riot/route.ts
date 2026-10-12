import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { riotApiKey, riotRequest, RiotError } from "@/lib/riot-api";
import { buildRiotRequest, riotEndpoints, riotGames, type RiotGame } from "@/lib/riot-catalog";
import { riotConnection, riotRsoConfigured } from "@/lib/riot-rso";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
const global = globalThis as typeof globalThis & { employeeRiotCache?: Map<string, { expires: number; data: unknown }>; employeeRiotPending?: Map<string, Promise<unknown>> };
const cache = global.employeeRiotCache ??= new Map();
const pending = global.employeeRiotPending ??= new Map();

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "sign-in-required" }, { status: 401, headers });
  if (user.role !== "employee") return NextResponse.json({ error: "employee-only" }, { status: 403, headers });
  const connection = await riotConnection(user.id);
  const params = new URL(request.url).searchParams;
  if (!params.has("endpoint")) return NextResponse.json({ endpoints: riotEndpoints, configured: Object.fromEntries(Object.keys(riotGames).map(game => [game, Boolean(riotApiKey(game))])), tournamentConfigured: Boolean(riotApiKey("lol", true)), rsoConfigured: riotRsoConfigured(), account: connection ? { puuid: connection.puuid, gameName: connection.gameName, tagLine: connection.tagLine } : null }, { headers });
  const endpoint = riotEndpoints.find(item => item.id === params.get("endpoint"));
  const game = params.get("game") as RiotGame;
  if (!endpoint || !Object.hasOwn(riotGames, game)) return NextResponse.json({ error: "invalid-endpoint" }, { status: 400, headers });
  const host = params.get("region") ?? "";
  const parameters = Object.fromEntries([...params].filter(([name]) => !["endpoint", "game", "region"].includes(name)));
  // Game is a control parameter and a Riot path parameter; it cannot be overridden by the browser.
  if (endpoint.path.includes("{game}")) parameters.game = game === "valorant" ? "val" : game;
  let path: string;
  try { path = buildRiotRequest(endpoint, game, host, parameters); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "invalid-parameters" }, { status: 400, headers }); }
  const playerData = endpoint.group.includes("match") && game === "valorant";
  if ((endpoint.rso || playerData) && !connection) return NextResponse.json({ error: "rso-required" }, { status: 403, headers });
  if (playerData && parameters.puuid && parameters.puuid !== connection?.puuid) return NextResponse.json({ error: "riot-account-mismatch" }, { status: 403, headers });
  try {
    const key = endpoint.rso ? connection!.accessToken : riotApiKey(game, endpoint.tournament);
    if (!key) throw new RiotError("key-missing", 503, 0);
    const cacheKey = `${createHash("sha256").update(key).digest("hex")}:${game}:${host}:${path}`;
    const cached = cache.get(cacheKey);
    let data = cached && cached.expires > Date.now() ? cached.data : undefined;
    if (data === undefined) {
      let task = pending.get(cacheKey);
      if (!task) {
        task = riotRequest<unknown>(host, path, { game, tournament: endpoint.tournament, ...(endpoint.rso ? { accessToken: connection!.accessToken } : {}) });
        pending.set(cacheKey, task);
      }
      try {
        data = await task;
        if (cache.size >= 200) cache.delete(cache.keys().next().value!);
        cache.set(cacheKey, { data, expires: Date.now() + 60_000 });
      } finally { pending.delete(cacheKey); }
    }
    if (playerData && parameters.matchId) {
      const match = data as { players?: { puuid: string }[] };
      if (!match.players?.some(player => player.puuid === connection!.puuid)) return NextResponse.json({ error: "riot-account-mismatch" }, { status: 403, headers });
    }
    return NextResponse.json({ endpoint: endpoint.id, region: host, data, updatedAt: Date.now() }, { headers });
  } catch (error) {
    const problem = error instanceof RiotError ? error : new RiotError("riot-unavailable");
    return NextResponse.json({ error: problem.code, retryAfter: problem.retryAfter }, { status: problem.status, headers: { ...headers, ...(problem.retryAfter > 0 ? { "Retry-After": String(problem.retryAfter) } : {}) } });
  }
}
