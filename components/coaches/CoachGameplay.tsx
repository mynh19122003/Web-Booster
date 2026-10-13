"use client";
import { publicRequest } from "@/services/public";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { Coach } from "@/data/coaches";
import { coachGameLogoPath } from "@/data/coaches";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import type { MatchHistory } from "@/lib/riot-types";
import { RiotProfileHistory } from "@/components/coaches/RiotProfileHistory";
import { CoachDataLoading } from "./CoachDataLoading";

export function CoachGameplay({ coach, initialHistory = null, managed = false }: { coach: Coach; initialHistory?: MatchHistory | null; managed?: boolean }) {
  const { language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const [history, setHistory] = useState<MatchHistory | null>(initialHistory);
  const [loading, setLoading] = useState(!initialHistory);
  useEffect(() => {
    if (managed) return;
    const abort = new AbortController();
    let pending = false;
    function refresh() {
      if (pending || document.hidden) return;
      pending = true;
      setLoading(true);
      setHistory(null);
      void publicRequest("/api/coaches/" + coach.slug + "/matches?refresh=1", { signal: abort.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("unavailable");
        return await response.json() as MatchHistory;
      }).then(data => {
        if (!abort.signal.aborted) setHistory(data);
      })
      .catch(() => {
        if (!abort.signal.aborted) setHistory({ status: "unavailable", matches: [] });
      })
      .finally(() => { pending = false; if (!abort.signal.aborted) setLoading(false); });
    }
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { abort.abort(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [coach.slug, managed]);

  return <div className="riot-profile-workspace">
    <div className="riot-workspace-heading">
      <div><p className="riot-workspace-eyebrow">{text("Riot account", "Tài khoản Riot")}</p><h2>{text("Rank & match history", "Rank & Lịch sử đấu")}</h2></div>
      <span className="riot-game-label"><Image src={coachGameLogoPath(coach.game)} alt="" width={20} height={20} />{coach.gameName}</span>
    </div>
    {loading && <CoachDataLoading label={text("Loading rank and recent matches from Riot…", "Đang tải rank và lịch sử đấu mới từ Riot…")} />}
    <RiotProfileHistory history={history} tft={coach.game === "teamfight-tactics"} valorant={coach.game === "valorant"} loading={loading} />
  </div>;
}
