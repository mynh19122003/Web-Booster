import catalog from "@/data/riot-endpoints.json";

export type RiotGame = "lol" | "tft" | "valorant";
export const riotGames = { lol: "League of Legends", tft: "Teamfight Tactics", valorant: "Valorant" } as const;
export type RiotParameter = { name: string; required: boolean; type: string; description: string; choices: string[] };
export type RiotEndpoint = {
  id: string; group: string; games: string[]; path: string; summary: string;
  hosts: string[]; pathInputs: RiotParameter[]; query: RiotParameter[];
  rso: boolean; tournament: boolean; docs: string;
};
export const riotEndpoints: RiotEndpoint[] = catalog;
export const riotPathParameters = (endpoint: RiotEndpoint) => [...endpoint.path.matchAll(/\{([^}]+)\}/g)].map(match => match[1]);

export function buildRiotRequest(endpoint: RiotEndpoint, game: RiotGame, host: string, parameters: Record<string, unknown>) {
  if (!endpoint.games.includes(game) || !endpoint.hosts.includes(host)) throw new Error("invalid-region");
  const names = riotPathParameters(endpoint);
  const allowed = new Set([...names, ...endpoint.query.map(parameter => parameter.name)]);
  if (Object.keys(parameters).some(name => !allowed.has(name))) throw new Error("invalid-parameters");
  const value = (name: string, required: boolean) => {
    const parameter = parameters[name];
    if (parameter === undefined || parameter === "") {
      if (required) throw new Error(`missing-parameter:${name}`);
      return "";
    }
    if (typeof parameter !== "string" || parameter.length > 256 || /[\x00-\x1f]/.test(parameter)) throw new Error("invalid-parameters");
    return parameter.trim();
  };
  const path = endpoint.path.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const parameter = value(name, true);
    if (!parameter || parameter === "." || parameter === "..") throw new Error("invalid-parameters");
    const input = endpoint.pathInputs.find(input => input.name === name);
    if (input?.choices.length && !input.choices.includes(parameter)) throw new Error("invalid-parameters");
    if (name === "game" && parameter !== (game === "valorant" ? "val" : game)) throw new Error("invalid-parameters");
    return encodeURIComponent(parameter);
  });
  const query = new URLSearchParams();
  for (const parameter of endpoint.query) {
    const input = value(parameter.name, parameter.required);
    if (!input) continue;
    if (parameter.choices.length && !parameter.choices.includes(input)) throw new Error("invalid-parameters");
    if (/^(int|long)$/.test(parameter.type) && !/^\d{1,16}$/.test(input)) throw new Error("invalid-parameters");
    const max = parameter.name === "count" ? 100 : parameter.name === "size" || parameter.name === "limit" ? 200 : undefined;
    if (max && (Number(input) < (parameter.name === "count" ? 0 : 1) || Number(input) > max)) throw new Error("invalid-parameters");
    query.set(parameter.name, input);
  }
  return `${path}${query.size ? `?${query}` : ""}`;
}
