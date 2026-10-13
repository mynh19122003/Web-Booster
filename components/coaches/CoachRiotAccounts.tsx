"use client";
import { publicRequest } from "@/services/public";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { riotPlatforms, type MatchHistory, type RiotAccount, type RiotPlatform } from "@/lib/riot-types";
import { parseRiotId } from "@/lib/riot-id";
import { RiotMatchPreview } from "@/components/coaches/RiotMatchPreview";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import { CoachProfileEditor } from "@/components/coaches/CoachProfileEditor";
import type { CoachProfileOverride } from "@/lib/coach-profile-db";
import { LoaderCircle, RefreshCw, Unplug } from "lucide-react";
import { CoachProfileHeader } from "@/components/employee/CoachProfileHeader";
import { CoachWorkspaceSetup, CoachAssignment } from "@/components/coaches/CoachWorkspaceSetup";
import { notifyCoachProfileUpdated, subscribeCoachProfileUpdates } from "@/lib/coach-profile-events";

type CoachConnection = {
  slug: string;
  name: string;
  game: string;
  server: string;
  account: RiotAccount | null;
  profile?: CoachProfileOverride | null;
  online: boolean;
  published: boolean;
  avatar?: string;
};

function Connection({ coach, scope, editMode = false }: { coach: CoachConnection; scope: "own" | "demo" | "admin"; editMode?: boolean }) {
  const { language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const [riotId, setRiotId] = useState(coach.account ? `${coach.account.gameName}#${coach.account.tagLine}` : "");
  const [platform, setPlatform] = useState<RiotPlatform>(coach.account?.platform ?? (Object.entries(riotPlatforms).find(([, label]) => label === coach.server)?.[0] as RiotPlatform | undefined) ?? "euw1");
  const [linked, setLinked] = useState(coach.account);
  const [profile, setProfile] = useState<CoachProfileOverride | null | undefined>(coach.profile);
  const [busy, setBusy] = useState<"history" | "save" | "unlink" | null>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [history, setHistory] = useState<MatchHistory | null>(null);
  const [retryAt, setRetryAt] = useState(0);
  const [canRetry, setCanRetry] = useState(true);
  const [online, setOnline] = useState(coach.online);
  const [published, setPublished] = useState(coach.published);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    let pending = false;
    async function refresh() {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const response = await publicRequest(`/api/employee/coaches/${coach.slug}/profile`, { cache: "no-store", signal: abort.signal });
        if (response.ok) {
          const data = await response.json();
          if (!abort.signal.aborted) {
            setProfile(data.override);
            setOnline(data.effective.online);
            setPublished(data.published);
          }
        }
      } catch {} finally { pending = false; }
    }
    const unsubscribe = subscribeCoachProfileUpdates(() => { void refresh(); });
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { unsubscribe(); abort.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [coach.slug]);

  async function changeStatus(kind: "online" | "published") {
    if (statusBusy) return;
    const next = !(kind === "online" ? online : published);
    setStatusBusy(true); setStatusMessage("");
    try {
      const response = await publicRequest(`/api/employee/coaches/${coach.slug}/profile`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [kind]: next }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (kind === "online") setOnline(data.effective.online);
      else setPublished(data.published);
      notifyCoachProfileUpdated();
      setStatusMessage(text("Status saved.", "Đã lưu trạng thái."));
    } catch { setStatusMessage(text("Could not update. Check your profile details and try again.", "Chưa cập nhật được. Kiểm tra thông tin hồ sơ và thử lại.")); }
    finally { setStatusBusy(false); }
  }

  useEffect(() => {
    if (!retryAt) return;
    const timer = setTimeout(() => setCanRetry(true), Math.max(0, retryAt - Date.now()));
    return () => clearTimeout(timer);
  }, [retryAt]);

  async function submit(action: "history" | "save" | "unlink", event?: FormEvent) {
    event?.preventDefault();
    if (busy || (action !== "unlink" && !canRetry)) return;
    if (action !== "unlink" && !parseRiotId(riotId)) {
      setFailed(true); setMessage(text("Enter Riot ID as Name#Tag, with one # between name and tag.", "Nhập Riot ID dạng Tên#Tag, có một dấu # giữa tên và tag.")); return;
    }
    setBusy(action); setMessage(""); setFailed(false);
    if (action === "history") setHistory(null);
    try {
      const response = await publicRequest(action === "history" ? "/api/employee/riot/history" : "/api/employee/coaches", {
        method: action === "history" ? "POST" : "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "history" ? { riotId, platform, game: coach.game === "teamfight-tactics" ? "tft" : "lol" }
          : { slug: coach.slug, riotId, platform, unlink: action === "unlink" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFailed(true);
        if (data.retryAfter > 0) { setCanRetry(false); setRetryAt(Date.now() + data.retryAfter * 1000); }
        setMessage(data.error === "account-not-found" ? text("Account not found on this server. Check Riot ID and server.", "Không tìm thấy tài khoản trên server này. Kiểm tra Riot ID và server.")
          : data.error === "key-missing" ? text("The server has no Riot API key configured for this game.", "Máy chủ chưa cấu hình Riot API key cho game này.")
          : data.error === "key-rejected" ? text("Riot rejected the server API key. Update it and check access for this game.", "Riot từ chối API key trên máy chủ. Cần cập nhật key hợp lệ và kiểm tra quyền truy cập game.")
          : data.error === "rate-limited" ? text(`Riot request limit reached. Try again in ${data.retryAfter} seconds.`, `Đã đạt giới hạn gọi Riot. Thử lại sau ${data.retryAfter} giây.`)
          : text("Could not load Riot data. Please try again later.", "Chưa tải được dữ liệu Riot. Vui lòng thử lại sau."));
        return;
      }
      if (action === "unlink") {
        setLinked(null); setHistory(null); setMessage(text("Account disconnected.", "Đã gỡ liên kết."));
      } else {
        setPlatform(data.account.platform); setRiotId(`${data.account.gameName}#${data.account.tagLine}`);
        if (action === "history") { setHistory(data); setMessage(text("Riot data synchronized.", "Đã đồng bộ dữ liệu Riot.")); }
        else { setLinked(data.account); setMessage(text("Verified and linked. Match history is available on the public profile.", "Đã xác minh và liên kết. Lịch sử đấu hiển thị trên hồ sơ công khai.")); }
      }
    } catch { setFailed(true); setMessage(text("Connection failed. Please try again.", "Lỗi kết nối. Vui lòng thử lại.")); }
    finally { setBusy(null); }
  }

  return (
    <section className="coach-profile-panel riot-connection">
      <CoachProfileHeader
        coach={{ ...coach, avatar: profile?.avatar || coach.avatar }}
        online={online}
        published={published}
        busy={statusBusy}
        canPublish={scope !== "demo"}
        onToggleOnline={() => changeStatus("online")}
        onTogglePublished={() => changeStatus("published")}
      />
      {statusMessage && <p role="status" className="coach-editor-help">{statusMessage}</p>}

      <div className="coach-section-title" style={{ marginTop: "16px" }}>
        <span>{text("Rank & Match History", "Rank & Lịch sử đấu")}</span>
      </div>

      {coach.game === "valorant" ? (
        <p style={{ margin: "0 0 16px" }}>
          {text(
            "Valorant needs an approved Riot Sign On connection before match history can be enabled.",
            "Valorant cần kết nối Riot Sign On được phê duyệt để bật lịch sử trận đấu."
          )}
          {" "}<Link href="/employee/riot">{text("Open Valorant data APIs", "Mở API dữ liệu Valorant")} ↗</Link>
        </p>
      ) : (
        <>
          <p>{linked ? `${linked.gameName}#${linked.tagLine} · ${riotPlatforms[linked.platform]}` : text("No Riot account linked", "Chưa liên kết tài khoản Riot")}</p>
          <form className="riot-sync-panel" onSubmit={event => submit("history", event)} aria-busy={Boolean(busy)}>
            <div className="riot-sync-fields has-server">
            <label>Riot ID<input value={riotId} onChange={e => setRiotId(e.target.value)} placeholder="Name#Tag" required maxLength={121} disabled={Boolean(busy)} aria-describedby={`${coach.slug}-riot-help`} /></label>
            <label>{text("Server", "Máy chủ")}<select value={platform} onChange={e => setPlatform(e.target.value as RiotPlatform)} disabled={Boolean(busy)}>{Object.entries(riotPlatforms).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <button type="submit" className="riot-sync-button" disabled={Boolean(busy) || !canRetry} aria-busy={busy === "history"}><RefreshCw size={16} className={busy === "history" ? "animate-spin" : ""} aria-hidden="true" />{busy === "history" ? text("Synchronizing…", "Đang đồng bộ…") : text("Sync Riot API", "Đồng bộ Riot API")}</button>
            <button type="button" className="riot-refresh-button" disabled={Boolean(busy) || !canRetry} aria-busy={busy === "history"} aria-label={text("Refresh match history", "Làm mới lịch sử đấu")} onClick={() => submit("history")}><RefreshCw size={18} className={busy === "history" ? "animate-spin" : ""} aria-hidden="true" /></button>
            </div>
            {history?.updatedAt && <p className="riot-sync-note">{text("Updated at", "Cập nhật lúc")} {new Date(history.updatedAt).toLocaleTimeString(language === "vi" ? "vi-VN" : "en-GB")}</p>}
            <p className="riot-sync-note" id={`${coach.slug}-riot-help`}>{text("Enter Name#Tag and select the server. Save the link to display it on the coach's public profile.", "Nhập Tên#Tag và chọn máy chủ. Lưu liên kết để hiển thị trên hồ sơ công khai của coach.")}</p>
            <div className="riot-connection-actions">
              <button type="button" className="coach-match-more" disabled={Boolean(busy) || !canRetry} aria-busy={busy === "save"} onClick={() => submit("save")}>{busy === "save" && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}{busy === "save" ? text("Verifying…", "Đang xác minh…") : text("Save coach link", "Lưu liên kết cho coach")}</button>
              {linked && <button type="button" className="coach-match-more" disabled={Boolean(busy)} aria-busy={busy === "unlink"} onClick={() => submit("unlink")}>{busy === "unlink" ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Unplug size={15} aria-hidden="true" />}{busy === "unlink" ? text("Disconnecting…", "Đang gỡ liên kết…") : text("Disconnect", "Gỡ liên kết")}</button>}
            </div>
          </form>
          {message && <p className="riot-connection-message" data-error={failed} role={failed ? "alert" : "status"}>{message}</p>}
          {history && <RiotMatchPreview history={history} tft={coach.game === "teamfight-tactics"} />}
        </>
      )}

      <CoachProfileEditor
        slug={coach.slug}
        coachName={coach.name}
        game={coach.game}
        server={coach.server}
        initialOverride={coach.profile}
        privileged={scope !== "own"}
        avatarFallback={coach.avatar}
        initialOpen={editMode}
        onProfileUpdated={(updated) => setProfile(updated)}
      />
    </section>
  );
}

export function CoachRiotAccounts({ selectedSlug, editMode = false }: { selectedSlug?: string; editMode?: boolean }) {
  const { language } = useLanguage();
  const [coaches, setCoaches] = useState<CoachConnection[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [scope, setScope] = useState<"own" | "demo" | "admin">("own");
  const [name, setName] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    publicRequest("/api/employee/coaches", { signal: abort.signal }).then(async response => {
      if (!response.ok) throw new Error("unavailable");
      const data = await response.json();
      setCoaches(data.coaches); setScope(data.scope); setName(data.name); setFailed(false);
    }).catch(() => { if (!abort.signal.aborted) setFailed(true); });
    return () => abort.abort();
  }, [revision]);

  return (
    <div className="riot-connections">
      {!coaches && (
        <p role="status">
          {failed
            ? translateText(language, "Could not load coach accounts. Reload to try again.", "Không thể tải tài khoản coach. Tải lại để thử tiếp.")
            : translateText(language, "Loading…", "Đang tải…")}
        </p>
      )}
      {coaches && <p className="coach-workspace-scope">{scope === "demo" ? translateText(language, "Coach workspace · Manage coach profiles", "Không gian coach · Quản lý hồ sơ coach") : scope === "admin" ? translateText(language, "Administrator · Manage and assign coach profiles", "Quản trị viên · Quản lý và gán hồ sơ coach") : translateText(language, "My coach profile · Only you can edit your profile", "Hồ sơ coach của tôi · Bạn quản lý hồ sơ riêng của mình")}</p>}
      {scope === "admin" && !editMode && <CoachAssignment key={revision} onAssigned={() => setRevision(r => r + 1)} />}
      {coaches?.length === 0 && scope === "own" && !editMode && <CoachWorkspaceSetup name={name} onCreated={() => setRevision(r => r + 1)} />}
      {coaches?.filter(coach => !selectedSlug || coach.slug === selectedSlug).map(coach => <Connection key={coach.slug} coach={coach} scope={scope} editMode={editMode} />)}
    </div>
  );
}
