"use client";
import { useId } from "react";
import { Check, Disc, Video } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";

export function CoachingSessionFormats({ formats, value, onChange }: { formats: ("live" | "vod")[]; value: "live" | "vod"; onChange: (value: "live" | "vod") => void }) {
  const { language, t } = useLanguage();
  const name = useId();
  return <fieldset className="coaching-format-cards"><legend>{translateText(language, "Session format", "Hình thức học")}</legend>
    {formats.map(format => <label key={format} data-selected={value === format}>
      <input type="radio" name={name} value={format} checked={value === format} onChange={() => onChange(format)} />
      {format === "live" ? <Video size={22} /> : <Disc size={22} />}
      <span><strong>{format === "live" ? t("coachLiveSession") : t("coachVodReview")}</strong><small>{format === "live" ? translateText(language, "Real-time guidance while you play", "Hướng dẫn trực tiếp khi bạn chơi") : translateText(language, "Detailed analysis of your replay", "Phân tích chi tiết trận đấu đã ghi")}</small></span>
      <Check className="format-selected-check" size={16} aria-hidden />
    </label>)}
  </fieldset>;
}
