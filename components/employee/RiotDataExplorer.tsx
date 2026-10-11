"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, Database, Download, Search, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import { riotGames, riotPathParameters, type RiotEndpoint, type RiotGame } from "@/lib/riot-catalog";

type Account = { puuid: string; gameName?: string; tagLine?: string };
type Catalog = { endpoints: RiotEndpoint[]; configured: Record<RiotGame, boolean>; tournamentConfigured: boolean; rsoConfigured: boolean; account: Account | null };
type Result = { endpoint: string; region: string; data: unknown; updatedAt: number };
const fieldLabels: Record<string, [string, string]> = {
  gameName: ["Riot game name", "Tên Riot"], tagLine: ["Riot tag", "Tag Riot"],
  puuid: ["Player PUUID", "PUUID người chơi"], encryptedPUUID: ["Player PUUID", "PUUID người chơi"],
  matchId: ["Match ID", "ID trận đấu"], queue: ["Queue", "Chế độ đấu"],
  tier: ["Rank tier", "Bậc xếp hạng"], division: ["Division", "Đoàn xếp hạng"],
  count: ["Number of results", "Số kết quả"], start: ["Start index", "Vị trí bắt đầu"], page: ["Page", "Trang"],
  championId: ["Champion ID", "ID tướng"], actId: ["Act ID", "ID mùa Valorant"],
  platformType: ["Console platform", "Nền tảng console"], size: ["Page size", "Kích thước trang"],
};

export function RiotDataExplorer({ connectionStatus }: { connectionStatus?: string }) {
  const { language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [game, setGame] = useState<RiotGame>("lol");
  const [endpointId, setEndpointId] = useState("account-v1.getByRiotId");
  const [region, setRegion] = useState("asia");
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [account, setAccount] = useState<Account | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const errors: Record<string, string> = {
    "key-missing": text("Configure a Riot API key on the server for this game.", "Cần cấu hình Riot API key trên máy chủ cho game này."),
    "key-rejected": text("Riot rejected this API key. It may have expired or lack access to this API.", "Riot từ chối API key. Key có thể hết hạn hoặc chưa có quyền dùng API này."),
    "rso-required": text("Connect your Riot account to access this data.", "Kết nối tài khoản Riot để truy cập dữ liệu này."),
    "rso-expired": text("Your Riot connection has expired. Please reconnect.", "Kết nối Riot đã hết hạn. Vui lòng kết nối lại."),
    "riot-account-mismatch": text("Valorant player data is available for your connected account and its matches.", "Dữ liệu người chơi Valorant chỉ dành cho tài khoản đã kết nối và các trận của tài khoản đó."),
    "account-not-found": text("No data found. Check the identifiers and selected region.", "Không tìm thấy dữ liệu. Kiểm tra ID và khu vực đã chọn."),
    "invalid-region": text("Select a supported region for this API.", "Chọn khu vực được API này hỗ trợ."),
    "invalid-parameters": text("Check the required fields and numeric limits.", "Kiểm tra các trường bắt buộc và giới hạn số."),
    "sign-in-required": text("Your session has expired. Please sign in again.", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."),
    "employee-only": text("This workspace requires employee access.", "Khu làm việc này yêu cầu quyền nhân viên."),
  };
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/employee/riot", { signal: abort.signal, cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error("load-failed");
      const data = await response.json() as Catalog;
      setCatalog(data); setAccount(data.account); setMessage("");
    }).catch(() => { if (!abort.signal.aborted) setMessage(text("Could not load Riot APIs. Please try again.", "Không tải được danh mục API Riot. Vui lòng thử lại.")); });
    return () => abort.abort();
    // Catalog labels are translated when rendered; language changes do not trigger requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAttempt]);
  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = window.setTimeout(() => setRetryAfter(0), retryAfter * 1000);
    return () => window.clearTimeout(timer);
  }, [retryAfter]);
  const endpoints = catalog?.endpoints.filter(item => item.games.includes(game)) ?? [];
  const endpoint = endpoints.find(item => item.id === endpointId);

  function chooseEndpoint(next: RiotEndpoint, nextGame = game) {
    setEndpointId(next.id); setRegion(next.hosts.includes(region) ? region : next.hosts[0]);
    const defaults: Record<string, string> = {};
    for (const name of riotPathParameters(next)) {
      if (/puuid/i.test(name)) defaults[name] = account?.puuid ?? "";
      else if (name === "gameName" || name === "tagLine") defaults[name] = account?.[name] ?? "";
      else if (name === "queue") defaults[name] = nextGame === "valorant" ? "competitive" : nextGame === "tft" ? (next.id.endsWith("getTopRatedLadder") ? "RANKED_TFT_TURBO" : "RANKED_TFT") : "RANKED_SOLO_5x5";
      const input = next.pathInputs.find(input => input.name === name);
      if (input?.choices.length && !input.choices.includes(defaults[name])) defaults[name] = input.choices[0];
    }
    for (const parameter of next.query) {
      if (parameter.name === "count" || parameter.name === "size") defaults[parameter.name] = "10";
      if (parameter.name === "platformType") defaults[parameter.name] = "xbox";
    }
    setParameters(defaults); setResult(null); setMessage("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!endpoint || busy) return;
    if (retryAfter > 0) { setMessage(text("Please wait before retrying.", "Vui lòng chờ trước khi thử lại.")); return; }
    setBusy(true); setMessage(""); setResult(null);
    const query = new URLSearchParams({ endpoint: endpoint.id, game, region });
    for (const [name, value] of Object.entries(parameters)) if (value.trim() && name !== "game") query.set(name, value.trim());
    try {
      const response = await fetch(`/api/employee/riot?${query}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        const retry = Number(data.retryAfter) || 0;
        setRetryAfter(retry);
        setMessage(data.error === "rate-limited" ? text(`Riot request limit reached. Retry in ${retry} seconds.`, `Đã chạm giới hạn Riot. Thử lại sau ${retry} giây.`) : errors[data.error] ?? text("Could not fetch data. Check the parameters or try again later.", "Không lấy được dữ liệu. Kiểm tra tham số hoặc thử lại sau."));
        return;
      }
      setResult(data);
      if (endpoint.group === "account-v1" && data.data?.puuid && data.data?.gameName) setAccount(data.data);
    } catch { setMessage(text("Connection failed. Please try again.", "Lỗi kết nối. Vui lòng thử lại.")); }
    finally { setBusy(false); }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `${result.endpoint}.json`; link.click(); URL.revokeObjectURL(url);
  }
  return <div className="riot-explorer">
    <section className="riot-explorer-connection">
      <ShieldCheck size={22} />
      <div><strong>{catalog?.account ? `${catalog.account.gameName}#${catalog.account.tagLine}` : text("Riot account connection", "Kết nối tài khoản Riot")}</strong>
        <p>{text("Riot Sign On enables APIs that require your consent, including Valorant player data.", "Riot Sign On mở các API cần sự đồng ý của bạn, gồm dữ liệu người chơi Valorant.")}</p>
        {connectionStatus === "failed" && <p role="alert">{text("Riot connection failed. Please try again.", "Kết nối Riot thất bại. Vui lòng thử lại.")}</p>}
      </div>
      {catalog?.rsoConfigured ? <a href="/api/employee/riot/connect" className="coach-btn-secondary">{catalog.account ? text("Reconnect", "Kết nối lại") : text("Connect Riot", "Kết nối Riot")} <ArrowUpRight size={16} /></a> : <span className="riot-api-badge">{text("RSO configuration required", "Cần cấu hình RSO")}</span>}
    </section>
    {!catalog ? <div role="status"><p>{message || text("Loading Riot APIs…", "Đang tải danh mục API Riot…")}</p>{message && <button type="button" className="coach-btn-secondary" onClick={() => setLoadAttempt(value => value + 1)}>{text("Try again", "Thử lại")}</button>}</div> : <>
      <div className="riot-game-tabs" aria-label={text("Select game", "Chọn game")}>
        {(Object.entries(riotGames) as [RiotGame, string][]).map(([value, label]) => <button type="button" key={value} aria-pressed={game === value} disabled={busy} onClick={() => { setGame(value); chooseEndpoint(catalog.endpoints.find(item => item.id === "account-v1.getByRiotId")!, value); }}>{label}<span>{catalog.endpoints.filter(item => item.games.includes(value)).length} API</span></button>)}
      </div>
      <div className="riot-explorer-grid">
        <section className="coach-profile-panel riot-api-form">
          <h2><Database size={20} />{text("Fetch Riot data", "Lấy dữ liệu Riot")}</h2>
          <p>{text("Select an API and region, then enter the identifiers. Account lookup fills the PUUID for subsequent queries.", "Chọn API và khu vực, rồi nhập ID cần tra cứu. Tra cứu tài khoản sẽ điền PUUID cho các truy vấn tiếp theo.")}</p>
          {account && <p className="riot-account-selection">{text("Selected account", "Tài khoản đã chọn")}: <strong>{account.gameName}#{account.tagLine}</strong></p>}
          <form onSubmit={submit}>
            <label>{text("Data API", "API dữ liệu")}<select value={endpointId} disabled={busy} onChange={event => chooseEndpoint(endpoints.find(item => item.id === event.target.value)!)}>
              {[...new Set(endpoints.map(item => item.group))].map(group => <optgroup key={group} label={group}>{endpoints.filter(item => item.group === group).map(item => <option key={item.id} value={item.id}>{item.summary}</option>)}</optgroup>)}
            </select></label>
            {endpoint && <>
              <div className="riot-api-description"><code>GET {endpoint.path}</code><a href={endpoint.docs} target="_blank" rel="noreferrer">{text("Riot documentation", "Tài liệu Riot")} ↗</a></div>
              <label>{text("Region / server", "Khu vực / máy chủ")}<select value={region} disabled={busy} onChange={event => setRegion(event.target.value)}>{endpoint.hosts.map(host => <option key={host} value={host}>{host.toUpperCase()}</option>)}</select></label>
              {riotPathParameters(endpoint).filter(name => name !== "game").map(name => {
                const choices = endpoint.pathInputs.find(input => input.name === name)?.choices ?? [];
                return <label key={name}>{fieldLabels[name] ? text(...fieldLabels[name]) : name} *{choices.length ? <select name={name} value={parameters[name] ?? ""} onChange={event => setParameters(previous => ({ ...previous, [name]: event.target.value }))} required disabled={busy}><option value="">{text("Select…", "Chọn…")}</option>{choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}</select> : <input name={name} value={parameters[name] ?? ""} onChange={event => setParameters(previous => ({ ...previous, [name]: event.target.value }))} required maxLength={256} disabled={busy} />}</label>;
              })}
              {endpoint.query.map(parameter => <label key={parameter.name}>{fieldLabels[parameter.name] ? text(...fieldLabels[parameter.name]) : parameter.name}{parameter.required ? " *" : ` (${text("optional", "không bắt buộc")})`}{parameter.choices.length ? <select name={parameter.name} value={parameters[parameter.name] ?? ""} onChange={event => setParameters(previous => ({ ...previous, [parameter.name]: event.target.value }))} required={parameter.required} disabled={busy}><option value="">{text("Select…", "Chọn…")}</option>{parameter.choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}</select> : <input name={parameter.name} type={/^(int|long)$/.test(parameter.type) ? "number" : "text"} min={parameter.name === "size" || parameter.name === "limit" ? 1 : 0} max={parameter.name === "count" ? 100 : parameter.name === "size" || parameter.name === "limit" ? 200 : undefined} value={parameters[parameter.name] ?? ""} onChange={event => setParameters(previous => ({ ...previous, [parameter.name]: event.target.value }))} required={parameter.required} maxLength={256} title={parameter.description} disabled={busy} />}</label>)}
              {!catalog.configured[game] && !endpoint.rso && !endpoint.tournament && <p className="riot-api-notice">{errors["key-missing"]}</p>}
              {endpoint.tournament && !catalog.tournamentConfigured && <p className="riot-api-notice">{text("This API requires a Riot tournament key.", "API này cần Riot tournament key.")}</p>}
              <button type="submit" className="button" disabled={busy || retryAfter > 0}><Search size={17} />{busy ? text("Fetching…", "Đang lấy dữ liệu…") : text("Fetch data", "Lấy dữ liệu")}</button>
            </>}
            {message && <p role="alert" className="riot-api-notice">{message}</p>}
          </form>
        </section>
        <section className="coach-profile-panel riot-api-result" aria-busy={busy}>
          <div className="riot-result-heading"><h2>{text("Results", "Kết quả")}</h2>{result && <button type="button" onClick={download} className="coach-btn-secondary"><Download size={15} />JSON</button>}</div>
          {result ? <><p>{result.region.toUpperCase()} · {new Date(result.updatedAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}</p><pre tabIndex={0} aria-label={text("Riot API result", "Kết quả API Riot")}>{JSON.stringify(result.data, null, 2)}</pre></> : <p role="status">{busy ? text("Waiting for Riot…", "Đang chờ Riot…") : text("Data from Riot will appear here.", "Dữ liệu từ Riot sẽ hiển thị tại đây.")}</p>}
        </section>
      </div>
      <p className="riot-explorer-note">{text(`${catalog.endpoints.length} data endpoints across 25 API groups. Results are cached for one minute. Paginated APIs return the requested page; fetch the next page to continue.`, `${catalog.endpoints.length} endpoint lấy dữ liệu thuộc 25 nhóm API. Kết quả được cache 1 phút. API phân trang trả về trang được yêu cầu; lấy trang tiếp theo để xem thêm.`)}</p>
    </>}
  </div>;
}
