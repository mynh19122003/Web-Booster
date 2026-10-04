"use client";
import Image from "next/image";
import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import { gameRanks, rankLevelsFor } from "@/lib/service-options";
export function RankPicker({
  game,
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  game: string;
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const levels = rankLevelsFor(game);
  const selected = levels[value];
  const tiers = gameRanks[game];
  const divisions = levels
    .map((rank, index) => ({ ...rank, index }))
    .filter((r) => r.tier === selected.tier);
  return (
    <fieldset className="rank-picker">
      <legend>{label}</legend>
      <div className="rank-selected">
        <RankEmblem game={game} tier={selected.tier} src={selected.icon} />
        <strong>{selected.label}</strong>
      </div>
      <div className="rank-grid" role="group" aria-label={`${label} tier`}>
        {tiers.map((tier) => {
          const candidates = levels
            .map((rank, index) => ({ ...rank, index }))
            .filter((r) => r.tier === tier && r.index >= min && r.index <= max);
          const representative =
            levels.find((r) => r.tier === tier && r.division === "3") ??
            levels.find((r) => r.tier === tier)!;
          const active = selected.tier === tier;
          return (
            <button
              key={tier}
              type="button"
              title={tier}
              aria-label={`${label}: ${tier}`}
              aria-pressed={active}
              disabled={!candidates.length}
              onClick={() =>
                onChange(
                  (
                    candidates.find((r) => r.division === selected.division) ??
                    candidates[0]
                  ).index,
                )
              }
            >
              <RankEmblem game={game} tier={tier} src={representative.icon} />
              <span>{tier}</span>
              {active && <Check size={12} className="rank-check" />}
            </button>
          );
        })}
      </div>
      {divisions.length > 1 && (
        <div
          className="division-picker"
          role="group"
          aria-label={`${label} division`}
        >
          {divisions.map((rank) => (
            <button
              key={rank.index}
              type="button"
              aria-label={`${label}: ${rank.label}`}
              aria-pressed={value === rank.index}
              disabled={rank.index < min || rank.index > max}
              onClick={() => onChange(rank.index)}
            >
              {game === "valorant" && (
                <Image
                  src={rank.icon}
                  alt=""
                  width={36}
                  height={36}
                  unoptimized
                />
              )}
              <span>{rank.division}</span>
            </button>
          ))}
        </div>
      )}
    </fieldset>
  );
}

// League client emblems include a large transparent canvas; fit the visible crest.
const leagueScale: Record<string, number> = {
  Iron: 3.12,
  Bronze: 2.62,
  Silver: 2.41,
  Gold: 2.39,
  Platinum: 2.34,
  Emerald: 2.12,
  Diamond: 1.96,
  Master: 2.05,
  Grandmaster: 1.97,
  Challenger: 1.91,
};
function RankEmblem({
  game,
  tier,
  src,
}: {
  game: string;
  tier: string;
  src: string;
}) {
  return (
    <span
      className={`rank-emblem ${game === "valorant" ? "" : "rank-emblem-league"}`}
      style={{ "--emblem-scale": leagueScale[tier] ?? 3 } as CSSProperties}
      aria-hidden="true"
    >
      <Image src={src} alt="" width={160} height={160} unoptimized />
    </span>
  );
}
