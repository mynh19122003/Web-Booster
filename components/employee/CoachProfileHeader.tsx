"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";

type CoachProfileHeaderProps = {
  coach: { slug: string; name: string; game: string; server: string; avatar?: string };
  online: boolean;
  published: boolean;
  busy: boolean;
  canPublish: boolean;
  onToggleOnline: () => void;
  onTogglePublished: () => void;
};

export function CoachProfileHeader({ coach, online, published, busy, canPublish, onToggleOnline, onTogglePublished }: CoachProfileHeaderProps) {
  const { language } = useLanguage();
  const reducedMotion = useReducedMotion();
  const text = (en: string, vi: string) => translateText(language, en, vi);

  return (
    <motion.div
      className="coach-header-row flex items-center justify-between"
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
    >
      <div className="coach-header-left">
        <Image
          className="coach-header-avatar"
          src={coach.avatar || `/images/coaches/${coach.slug}.svg`}
          alt={coach.name}
          width={46}
          height={46}
          unoptimized={Boolean(coach.avatar?.startsWith("data:"))}
        />
        <div className="coach-header-identity">
          <h2>{published ? <Link href={`/coaches/${coach.slug}`}>{coach.name}</Link> : coach.name}</h2>
          <span className="coach-game-pill">{coach.game} · {coach.server}</span>
        </div>
      </div>
      <div className="coach-header-actions">
        <button
          type="button"
          role="switch"
          aria-checked={online}
          aria-label={text("Accept coaching sessions", "Nhận coaching")}
          aria-busy={busy}
          className={`coach-availability-switch ${online ? "is-online" : ""}`}
          disabled={busy}
          onClick={onToggleOnline}
        >
          <span className="coach-switch-track" aria-hidden="true"><i /></span>
          <span>{online ? text("Online · Accepting coaching", "Online · Đang nhận coaching") : text("Offline · Not available", "Offline · Chưa nhận coaching")}</span>
          {busy && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}
        </button>
        {canPublish && (
          <button className="coach-btn-secondary" type="button" disabled={busy} onClick={onTogglePublished}>
            {published ? text("Unpublish profile", "Ẩn hồ sơ") : text("Publish profile", "Công khai hồ sơ")}
          </button>
        )}
        {published && (
          <Link href={`/coaches/${coach.slug}`} target="_blank" rel="noopener noreferrer" className="coach-btn-secondary coach-public-profile-link">
            {text("View public profile", "Xem hồ sơ công khai")} <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
