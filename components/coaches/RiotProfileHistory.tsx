"use client";
import { useState } from "react";
import Image from "next/image";
import { Trophy, Swords } from "lucide-react";
import { AccountImage } from "@/components/account/AccountImage";
import { championIconSources } from "@/lib/account-artwork";
import { lolImageVersion } from "@/data/lol-champion-image-keys";
import { filterRiotMatches, lolMatchFilters, tftMatchFilters, rankQueueFor, rankWinRate, riotTierNames } from "@/lib/riot-display";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText, intlLocales } from "@/lib/i18n";
import { riotPlatforms, type MatchHistory } from "@/lib/riot-types";

export function RiotProfileHistory({ history, tft, loading = false, valorant = false }: { history: MatchHistory | null; tft: boolean; loading?: boolean; valorant?: boolean }) {
  const { language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const [filter, setFilter] = useState(tft ? "ranked" : "solo");
  const [expanded, setExpanded] = useState(false);
  const matches = history?.matches ?? [];
  const filtered = filterRiotMatches(matches, filter, tft);
  const filters = valorant ? [{ id: "solo", label: "Competitive", queues: [] }, { id: "normal", label: "Unrated", queues: [] }, { id: "all", label: "All", queues: [] }] : tft ? tftMatchFilters : lolMatchFilters;
  const rank = history?.ranks?.find(item => item.queue === rankQueueFor(filter, tft));
  const ranked = history?.status === "ready" && !history.rankError && Boolean(history.ranks);
  const riotId = history?.account ? `${history.account.gameName}#${history.account.tagLine}` : "";
  const rankLabel = !history ? text("Loading rank…", "Đang tải rank…")
    : history.status === "unlinked" ? text("No account linked", "Chưa liên kết tài khoản")
    : history.status === "unsupported" ? text("Riot connection required", "Cần kết nối Riot")
    : !ranked ? text("Rank unavailable", "Chưa tải được rank")
    : !rank ? text("Unranked", "Chưa xếp hạng")
    : `${language === "vi" ? riotTierNames[rank.tier] ?? rank.tier : rank.tier.charAt(0) + rank.tier.slice(1).toLowerCase()} ${rank.division}`;
  const status = !history ? text("Loading Riot data…", "Đang tải dữ liệu Riot…")
    : history.status === "unlinked" ? text("This coach has not linked a Riot account yet.", "Coach chưa liên kết tài khoản Riot.")
    : history.status === "unsupported" ? text("Valorant match history requires an approved Riot Sign On connection.", "Lịch sử Valorant cần kết nối Riot Sign On được phê duyệt.")
    : history.status === "unavailable" ? history.error === "rate-limited" ? text("Riot's request limit was reached. Please try again later.", "Đã chạm giới hạn truy vấn Riot. Vui lòng thử lại sau.")
    : ["key-rejected", "key-missing"].includes(history.error ?? "") ? text("The server Riot API key needs to be updated.", "Cần cập nhật Riot API key trên máy chủ.")
    : text("Riot data is temporarily unavailable. Please try again later.", "Tạm thời chưa tải được dữ liệu Riot. Vui lòng thử lại sau.")
    : !matches.length ? text("No recent public matches found.", "Chưa có trận đấu công khai gần đây.") : "";
  const date = (timestamp: number) => new Intl.DateTimeFormat(intlLocales[language], { dateStyle: "short", timeStyle: "short" }).format(timestamp);
  const number = (value: number) => new Intl.NumberFormat(intlLocales[language]).format(value);
  const rankQueue = valorant ? "COMPETITIVE" : tft ? filter === "double" ? "DOUBLE UP" : filter === "hyper" ? "HYPER ROLL" : "RANKED TFT" : filter === "flex" ? "RANKED FLEX" : "RANKED SOLO/DUO";

  return <div className="riot-profile-results" aria-busy={loading}>
    <section className="riot-rank-card" aria-label={text("Current rank", "Rank hiện tại")}>
      <div className="riot-rank-emblem">
        {rank && Object.hasOwn(riotTierNames, rank.tier) ? <Image src={`/images/ranks/cards/league/${rank.tier.toLowerCase()}.webp`} alt="" width={140} height={140} /> : <Trophy size={66} strokeWidth={1.2} />}
      </div>
      <div className="riot-rank-copy"><span className="riot-rank-queue">{rankQueue}</span><h3>{rankLabel}</h3>
        {riotId && <p>{riotId} <span>· {riotPlatforms[history!.account!.platform]}</span></p>}
        {rank && <strong>{number(rank.leaguePoints)} LP · {text("Wins", "Thắng")} {number(rank.wins)} / {text("Losses", "Thua")} {number(rank.losses)} <em>({rankWinRate(rank)}%)</em></strong>}
        {history?.rankError && <small>{text("Match history is available; ranked data could not be loaded.", "Lịch sử đấu đã tải; chưa lấy được dữ liệu xếp hạng.")}</small>}
      </div>
    </section>

    <section className="riot-history-card" aria-label={text("Match history", "Lịch sử đấu")}>
      <div className="riot-mode-filters" role="group" aria-label={text("Filter game modes", "Lọc chế độ đấu")}>
        {filters.map(item => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setExpanded(false); }}>
          {item.id === "all" ? text("All", "Tất cả") : item.id === "normal" && !valorant ? text("Normal", "Thường") : item.label} <span>({filterRiotMatches(matches, item.id, tft).length})</span>
        </button>)}
      </div>
      <p className="riot-history-caption">{text(`Game modes in the ${matches.length} most recent matches.`, `Các chế độ trong ${matches.length} trận gần nhất.`)}</p>
      {history?.updatedAt && <p className="riot-history-caption">{text("Updated", "Cập nhật")} <time dateTime={new Date(history.updatedAt).toISOString()}>{date(history.updatedAt)}</time></p>}
      {status && <div className="riot-history-empty" role="status"><Swords size={24} /><p>{status}</p></div>}
      {!status && !filtered.length && <div className="riot-history-empty" role="status"><Swords size={24} /><p>{text("No recent matches in this mode. Choose another filter.", "Chưa có trận gần đây trong chế độ này. Chọn bộ lọc khác để xem.")}</p></div>}
      <div className="riot-rich-match-list">{filtered.slice(0, expanded ? 20 : 5).map(match => <article className="riot-rich-match" data-result={match.won ? "win" : "loss"} key={match.id}>
        <div className="riot-match-portrait"><AccountImage key={match.championId ?? match.pick} sources={tft ? ["/images/logos/teamfight-tactics-source.png"] : championIconSources(match.pick, match.championId)} alt={match.pick} width={58} height={58} fallbackLabel={match.pick} />{match.level != null && <span>{match.level}</span>}</div>
        <div className="riot-match-details"><strong>{match.pick}</strong><small>{match.mode} · {match.role}</small>
          {!tft && <div className="riot-match-loadout">
            <div className="riot-match-items" aria-label={text("Items", "Trang bị")}>{(match.items ?? []).map((item, index) => item > 0
              ? <AccountImage key={`${index}:${item}`} sources={[`https://ddragon.leagueoflegends.com/cdn/${lolImageVersion}/img/item/${item}.png`]} alt={text(`Item slot ${index + 1}`, `Ô trang bị ${index + 1}`)} width={30} height={30} />
              : <span className="riot-item-empty" key={index} aria-hidden="true" />)}</div>
            <small className="riot-match-economy">{number(match.gold ?? 0)} {text("gold", "vàng")} · {number(match.damage ?? 0)} {text("damage", "sát thương")}</small>
          </div>}
        </div>
        <div className="riot-match-kda"><strong>{tft ? `#${match.placement}` : `${match.kills ?? 0}/${match.deaths ?? 0}/${match.assists ?? 0}`}</strong><small>{tft ? text("Placement", "Xếp hạng") : "KDA"}</small></div>
        {!tft && <div className="riot-match-cs"><strong>{number(match.cs ?? 0)} CS</strong><small>{((match.cs ?? 0) / Math.max(1, match.duration / 60)).toFixed(1)} {text("CS/min", "CS/phút")}</small></div>}
        <div className="riot-match-outcome"><strong>{tft ? match.won ? "Top 4" : text("Bottom 4", "Ngoài Top 4") : match.won ? text("Victory", "Thắng") : text("Defeat", "Thua")}</strong><small>{Math.floor(match.duration / 60)}:{String(match.duration % 60).padStart(2, "0")}</small><time dateTime={new Date(match.playedAt).toISOString()}>{date(match.playedAt)}</time></div>
      </article>)}</div>
      {filtered.length > 5 && <button type="button" className="riot-show-more" onClick={() => setExpanded(value => !value)}>{expanded ? text("Show fewer", "Thu gọn") : text("Show more matches", "Xem thêm trận")}</button>}
    </section>
  </div>;
}
