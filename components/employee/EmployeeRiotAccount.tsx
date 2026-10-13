"use client";
import { useState, useSyncExternalStore } from "react";
import { parseRiotId } from "@/lib/riot-id";
import { riotPlatforms, type RiotPlatform, type MatchHistory } from "@/lib/riot-types";
import { publicMockMode } from "@/lib/public-data-source";
import employeeAccounts from "@/mocks/employee-accounts.json";
import type { Employee } from "@/types/workflow";

type RiotSettings = { riotId: string; game: string; platform: RiotPlatform; history: MatchHistory; source: "riot" };
const keyFor = (id: string) => `ascend-employee-riot-v1:${id}`;
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("employee-riot-updated", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("employee-riot-updated", callback); };
}
export function useEmployeeRiotAccount(employee: Employee | undefined): RiotSettings | null {
  const raw = useSyncExternalStore(subscribe, () => {
    try { return employee ? localStorage.getItem(keyFor(employee.id)) : null; } catch { return null; }
  }, () => null);
  try {
    const saved = raw ? JSON.parse(raw) as RiotSettings : null;
    return saved?.source === "riot" && saved.history?.status === "ready" && Array.isArray(saved.history.matches) && parseRiotId(saved.riotId) && Object.hasOwn(riotPlatforms, saved.platform) && employee?.games.some(game => game === saved.game) ? saved : null;
  } catch { return null; }
}
export function EmployeeRiotAccount({ employee, saved }: { employee: Employee; saved: RiotSettings | null }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(data: FormData) {
    const id = parseRiotId(data.get("riotId"));
    const game = String(data.get("game"));
    const platform = String(data.get("platform")) as RiotPlatform;
    if (!id || !employee.games.some(allowed => allowed === game) || !Object.hasOwn(riotPlatforms, platform)) {
      setMessage("Nhập Riot ID theo định dạng Tên#Tag và chọn game, máy chủ hợp lệ."); return;
    }
    setBusy(true); setMessage("");
    try {
      if (game === "Valorant") throw new Error("Valorant cần kết nối Riot Sign On để tải rank và lịch sử đấu.");
      const response = await fetch("/api/employee/riot/history", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ riotId: `${id.gameName}#${id.tagLine}`, platform, game: game === "Teamfight Tactics" ? "tft" : "lol", publishProfile: true, ...(publicMockMode ? { employee: employeeAccounts.find(account => account.id === employee.id) } : {}) }) });
      const history = await response.json() as MatchHistory;
      const errors: Record<string, string> = { "key-missing": "Máy chủ chưa cấu hình Riot API key.", "key-rejected": "Riot API key đã hết hạn hoặc không hợp lệ. Cần cập nhật key trên máy chủ.", "account-not-found": "Không tìm thấy tài khoản Riot. Kiểm tra Riot ID, game và máy chủ.", "rate-limited": `Riot đang giới hạn truy vấn. Thử lại sau ${history.retryAfter ?? 60} giây.`, unauthorized: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "connection-failed": "Không kết nối được Riot API. Vui lòng thử lại." };
      if (!response.ok || history.status !== "ready" || !history.account) throw new Error(errors[history.error ?? ""] ?? "Không tải được tài khoản Riot. Kiểm tra Riot ID và máy chủ rồi thử lại.");
      // Riot resolves the active platform and canonical account name; do not retain the input server when it differs.
      localStorage.setItem(keyFor(employee.id), JSON.stringify({ riotId: `${history.account.gameName}#${history.account.tagLine}`, platform: history.account.platform, game, history, source: "riot" }));
      window.dispatchEvent(new Event("employee-riot-updated"));
      setEditing(false); setMessage(history.rankError ? "Đã cập nhật lịch sử đấu. Chưa tải được rank từ Riot; vui lòng thử cập nhật lại." : "Đã cập nhật tài khoản, rank và lịch sử đấu từ Riot.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không lưu được tài khoản Riot."); }
    finally { setBusy(false); }
  }
  return <section className="employee-riot-settings">
    <div><h2>Tài khoản Riot</h2><p>{saved?.riotId ?? employee.riotId} · {saved ? riotPlatforms[saved.platform] : "VN"}</p></div>
    <button type="button" onClick={() => { setEditing(!editing); setMessage(""); }} disabled={busy}>{editing ? "Đóng" : "Chỉnh sửa tài khoản Riot"}</button>
    {saved && !editing && <button type="button" disabled={busy} onClick={() => { const data = new FormData(); for (const [name, value] of Object.entries({ riotId: saved.riotId, game: saved.game, platform: saved.platform })) data.set(name, value); void save(data); }}>{busy ? "Đang tải từ Riot…" : "Cập nhật từ Riot"}</button>}
    {editing && <form onSubmit={event => { event.preventDefault(); void save(new FormData(event.currentTarget)); }}>
      <label>Riot ID<input name="riotId" defaultValue={saved?.riotId ?? employee.riotId} placeholder="Luna#VN2" required maxLength={121} disabled={busy} /></label>
      <label>Trò chơi<select name="game" defaultValue={saved?.game ?? employee.games[0]} disabled={busy}>{employee.games.map(game => <option key={game}>{game}</option>)}</select></label>
      <label>Máy chủ<select name="platform" defaultValue={saved?.platform ?? "vn2"} disabled={busy}>{Object.entries(riotPlatforms).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <p>Tra cứu Riot ID theo game và máy chủ để cập nhật rank, LP và lịch sử đấu từ Riot API.</p>
      <button disabled={busy}>{busy ? "Đang tải từ Riot…" : "Lưu và cập nhật từ Riot"}</button>
    </form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
