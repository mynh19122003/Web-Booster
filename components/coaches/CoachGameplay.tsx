"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { Coach } from "@/data/coaches";
import { coachGameLogoPath } from "@/data/coaches";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import type { MatchHistory } from "@/lib/riot-types";
import { RiotProfileHistory } from "@/components/coaches/RiotProfileHistory";

export function CoachGameplay({ coach, initialHistory = null }: { coach: Coach; initialHistory?: MatchHistory | null }) {
  const { language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const [history, setHistory] = useState<MatchHistory | null>(initialHistory);
  const [loading, setLoading] = useState(!initialHistory);
  useEffect(() => {
    const abort = new AbortController();
    let pending = false;
    function refresh() {
      if (pending || document.hidden) return;
      pending = true;
      void fetch("/api/coaches/" + coach.slug + "/matches", { signal: abort.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("unavailable");
        return await response.json() as MatchHistory;
      }).then(data => {
        if (!abort.signal.aborted) setHistory(previous => data.status === "unavailable" && previous?.status === "ready" ? previous : data);
      })
      .catch(() => {
        if (!abort.signal.aborted) setHistory(previous => previous ?? { status: "unavailable", matches: [] });
      })
      .finally(() => { pending = false; if (!abort.signal.aborted) setLoading(false); });
    }
    refresh();
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { abort.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [coach.slug]);

  return <div className="riot-profile-workspace">
    <div className="riot-workspace-heading">
      <div><p className="riot-workspace-eyebrow">{text("Riot account", "Tài khoản Riot")}</p><h2>{text("Rank & match history", "Rank & Lịch sử đấu")}</h2></div>
      <span className="riot-game-label"><Image src={coachGameLogoPath(coach.game)} alt="" width={20} height={20} />{coach.gameName}</span>
    </div>
    <RiotProfileHistory history={history} tft={coach.game === "teamfight-tactics"} valorant={coach.game === "valorant"} loading={loading} />
  </div>;
}
