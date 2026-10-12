"use client";

import { useEffect, useState } from "react";
import { Swords } from "lucide-react";
import { TopChampionsList } from "@/components/coaches/TopChampionsList";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import type { CoachChampionStats } from "@/lib/riot-types";
import { CoachDataLoading } from "./CoachDataLoading";

export function CoachTopChampions({ slug }: { slug: string }) {
  const { language } = useLanguage();
  const copy = (en: string, vi: string) => translateText(language, en, vi);
  const [stats, setStats] = useState<CoachChampionStats | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    void fetch(`/api/riot/coach-stats?coach=${encodeURIComponent(slug)}&refresh=1`, { signal: abort.signal, cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error(); return response.json() as Promise<CoachChampionStats>; })
      .then(value => { if (!abort.signal.aborted) setStats(value); })
      .catch(() => { if (!abort.signal.aborted) setStats({ status: "unavailable", topChampions: [], sampleSize: 0 }); });
    return () => abort.abort();
  }, [slug, attempt]);
  return <section className="coach-profile-panel coach-top-champions" aria-busy={!stats}>
    <div className="coach-profile-section-title"><Swords size={18} /><div><h2>{copy("Top champions", "Tướng chơi nhiều nhất")}</h2><small>{copy("Last 30 ranked Solo/Duo games", "30 trận Solo/Duo xếp hạng gần nhất")}</small></div></div>
    {!stats && <CoachDataLoading label={copy("Loading and analysing recent ranked games…", "Đang tải và phân tích các trận xếp hạng gần nhất…")} />}
    {!stats ? <div className="champion-stats-skeleton" role="status" aria-label={copy("Loading champion statistics", "Đang tải thống kê tướng")}>{[1, 2, 3].map(value => <div key={value}><i /><span /></div>)}</div>
      : stats.topChampions.length ? <><TopChampionsList champions={stats.topChampions} /><p className="champion-stats-note">{stats.sampleSize} {copy("ranked games analysed", "trận xếp hạng được phân tích")}{stats.error && ` · ${copy("Showing last saved statistics; Riot is temporarily unavailable.", "Hiển thị thống kê đã lưu; Riot tạm thời không khả dụng.")}`}</p></>
      : <p className="champion-stats-note">{stats.status === "unlinked" ? copy("Link a Riot account to show ranked champion statistics.", "Liên kết tài khoản Riot để hiển thị thống kê tướng.") : stats.status === "unavailable" ? copy("Champion statistics are temporarily unavailable.", "Thống kê tướng tạm thời không khả dụng.") : copy("No ranked Solo/Duo games found in this sample.", "Không có trận Solo/Duo xếp hạng trong mẫu này.")}</p>}
    {stats?.status === "unavailable" && <button type="button" className="coach-profile-edit-link" onClick={() => { setStats(null); setAttempt(value => value + 1); }}>{copy("Retry", "Thử lại")}</button>}
  </section>;
}
