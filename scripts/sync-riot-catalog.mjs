// Refresh the GET endpoint catalog from Riot's official API reference HTML.
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";

const groups = ["account-v1", "champion-mastery-v4", "champion-v3", "clash-v1", "league-exp-v4", "league-v4", "lol-challenges-v1", "lol-rso-match-v1", "lol-status-v4", "match-v5", "spectator-v5", "summoner-v4", "tournament-stub-v5", "tournament-v5", "spectator-tft-v5", "tft-league-v1", "tft-match-v1", "tft-status-v1", "tft-summoner-v1", "val-console-match-v1", "val-console-ranked-v1", "val-content-v1", "val-match-v1", "val-ranked-v1", "val-status-v1"];
const clean = value => value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16))).replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/\s+/g, " ").trim();
const endpoints = [];
const inputParameters = section => [...section.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].flatMap(([, row]) => {
  const name = row.match(/(?:input|select)[^>]*name=["']([^"']+)["']/)?.[1];
  if (!name) return [];
  const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(([, value]) => clean(value));
  const choices = [...row.matchAll(/<option[^>]*>([\s\S]*?)<\/option>/g)].map(([, value]) => clean(value)).filter(Boolean);
  return [{ name, required: cells[0]?.includes("required") ?? false, type: cells[2] ?? "string", description: cells[3] ?? "", choices }];
});
mkdirSync(new URL("../.data/riot-reference/", import.meta.url), { recursive: true });
for (const group of groups) {
  const cache = new URL(`../.data/riot-reference/${group}.json`, import.meta.url);
  let document;
  if (process.argv.includes("--cached") && existsSync(cache)) document = JSON.parse(readFileSync(cache, "utf8"));
  else {
    const response = await fetch(`https://developer.riotgames.com/api-details/${group}`);
    if (!response.ok) throw new Error(`${group}: HTTP ${response.status}`);
    document = await response.json();
    writeFileSync(cache, JSON.stringify(document));
  }
  const { html } = document;
  const operations = html.split(/<li[^>]*class="[^"]*\boperation\b[^"]*"[^>]*>/).slice(1);
  for (const operation of operations) {
    const link = operation.match(/href="#([^"/]+)\/(GET_[^"]+)"[^>]*>(\/[^<]+)<\/a>/);
    if (!link || /Esports/.test(link[2])) continue;
    const path = clean(link[3]);
    const summary = clean(operation.match(/<ul class="options">\s*<li><a[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? link[2].slice(4));
    const querySection = operation.split("<!-- QUERY PARAMS -->")[1]?.split(/<!-- [A-Z ]+ -->/)[0] ?? "";
    const query = inputParameters(querySection);
    const pathInputs = inputParameters(operation.split("<!-- PATH PARAMS -->")[1]?.split(/<!-- [A-Z ]+ -->/)[0] ?? "");
    const hostSection = operation.match(/<select[^>]*name\s*=\s*['"]execute_against['"][^>]*>([\s\S]*?)<\/select>/)?.[1] ?? "";
    const hosts = [...hostSection.matchAll(/<option[^>]*value=['"]([^'"]+)['"]/g)].map(([, value]) => value.toLowerCase());
    // Tournament APIs use the single global Americas routing endpoint.
    if (group.startsWith("tournament-") && hosts.length === 0) hosts.push("americas");
    endpoints.push({ id: `${group}.${link[2].slice(4)}`, group, games: group === "account-v1" ? (path.includes("active-shards") ? ["valorant"] : path.includes("/region/") ? ["lol", "tft"] : ["lol", "tft", "valorant"]) : group.startsWith("val-") ? ["valorant"] : /tft/.test(group) ? ["tft"] : ["lol"], path, pathInputs, summary, hosts, query, rso: /\/me$/.test(path) || group === "lol-rso-match-v1", tournament: group.startsWith("tournament-"), docs: `https://developer.riotgames.com/apis#${group}/${link[2]}` });
  }
  console.log(`${group}: ${endpoints.filter(e => e.group === group).length} GET endpoints`);
}
if (endpoints.length < 50 || endpoints.some(e => !e.hosts.length)) throw new Error(`Incomplete API reference; catalog was not overwritten. Missing hosts: ${endpoints.filter(e => !e.hosts.length).map(e => e.id).join(", ")}`);
writeFileSync(new URL("../data/riot-endpoints.json", import.meta.url), `${JSON.stringify(endpoints, null, 2)}\n`);
console.log(`Saved ${endpoints.length} official GET endpoints.`);
