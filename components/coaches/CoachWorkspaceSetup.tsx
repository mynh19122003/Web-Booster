"use client";
import { publicRequest } from "@/services/public";

import { useEffect, useState, type FormEvent } from "react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import { coachRanksByGame } from "@/data/coaches";
import { coachLanguageOptions, coachRoleOptions } from "@/lib/coach-options";
import { ProfileChecklist } from "@/components/coaches/ProfileChecklist";

export function CoachWorkspaceSetup({ name, onCreated }: { name: string; onCreated: () => void }) {
  const { language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [game, setGame] = useState("league-of-legends");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [roles, setRoles] = useState<string[]>([]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    try {
      const response = await publicRequest("/api/employee/coaches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: fields.get("name"), game: fields.get("game"), server: fields.get("server"), peakRank: fields.get("rank"),
        hourlyRate: Number(fields.get("rate")), bio: fields.get("bio"),
        languages, roles,
      }) });
      if (!response.ok) throw new Error("create");
      onCreated();
    } catch { setMessage(text("Could not create profile. Check your details and try again.", "Chưa tạo được hồ sơ. Kiểm tra thông tin và thử lại.")); }
    finally { setBusy(false); }
  }
  return <section className="coach-profile-panel coach-workspace-setup">
    <h2>{text("Create my coach profile", "Tạo hồ sơ coach của tôi")}</h2>
    <p>{text("Start with a private draft. Publish it when you are ready to appear in the coach directory.", "Bắt đầu với hồ sơ nháp. Công khai khi bạn sẵn sàng xuất hiện trong danh sách coach.")}</p>
    <form onSubmit={create} aria-busy={busy}>
      <fieldset disabled={busy} className="coach-setup-fields">
        <label>{text("Display name", "Tên hiển thị")}<input name="name" defaultValue={name} required maxLength={60} /></label>
        <label>Game<select name="game" value={game} onChange={event => { setGame(event.target.value); setRoles([]); }}><option value="league-of-legends">League of Legends</option><option value="teamfight-tactics">Teamfight Tactics</option><option value="valorant">Valorant</option></select></label>
        <label>{text("Server", "Máy chủ")}<input name="server" placeholder="VN / EUW / NA / APAC" required maxLength={20} /></label>
        <label>{text("Peak rank", "Rank cao nhất")}<select key={game} name="rank" defaultValue={game === "valorant" ? "Radiant" : "Master"}>{coachRanksByGame[game].map(rank => <option key={rank} value={rank}>{rank}</option>)}</select></label>
        <label>{text("Hourly rate (USD)", "Giá mỗi giờ (USD)")}<input name="rate" type="number" min={1} max={500} step={1} defaultValue={20} required /></label>
        <ProfileChecklist label={text("Languages", "Ngôn ngữ")} options={coachLanguageOptions} selected={languages} onChange={setLanguages} />
        <ProfileChecklist label={text("Roles", "Vai trò")} options={coachRoleOptions(game)} selected={roles} onChange={setRoles} />
        <label className="coach-setup-bio">{text("Introduction", "Giới thiệu")}<textarea name="bio" rows={4} maxLength={1000} required /></label>
      </fieldset>
      <p className="coach-editor-help">{text("Select at least one role and language.", "Chọn ít nhất một vai trò và ngôn ngữ.")}</p>
      <button className="coach-editor-save" disabled={busy || !roles.length || !languages.length}>{busy ? text("Creating…", "Đang tạo…") : text("Create profile", "Tạo hồ sơ")}</button>
      {message && <p role="alert">{message}</p>}
    </form>
  </section>;
}

export function CoachAssignment({ onAssigned }: { onAssigned: () => void }) {
  const { language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const [data, setData] = useState<{ employees: { id: string; name: string; email: string }[]; coaches: { slug: string; name: string }[] } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; publicRequest("/api/employee/coaches/assignment").then(r => r.ok ? r.json() : null).then(d => { if (active) setData(d); }).catch(() => {}); return () => { active = false; }; }, []);
  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true); setMessage("");
    try {
      const response = await publicRequest("/api/employee/coaches/assignment", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: fields.get("userId"), slug: fields.get("slug") }) });
      if (!response.ok) throw new Error("assign");
      onAssigned();
    } catch { setMessage(text("Could not assign. An account and a profile can only be linked once.", "Chưa gán được. Mỗi tài khoản và hồ sơ chỉ được liên kết một lần.")); }
    finally { setBusy(false); }
  }
  if (!data) return null;
  return <section className="coach-profile-panel coach-workspace-setup"><h2>{text("Assign coach profile", "Gán hồ sơ coach")}</h2>
    <form onSubmit={assign}><fieldset className="coach-setup-fields" disabled={busy || !data.employees.length}>
      <label>Employee<select name="userId" required>{data.employees.map(e => <option key={e.id} value={e.id}>{e.name} · {e.email}</option>)}</select></label>
      <label>Coach<select name="slug" required>{data.coaches.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
    </fieldset><button className="coach-editor-save" disabled={busy || !data.employees.length || !data.coaches.length}>{text("Assign profile", "Gán hồ sơ")}</button>
    {!data.employees.length && <p>{text("Every employee already has a profile.", "Các employee đã có hồ sơ hoặc quyền quản lý riêng.")}</p>}
    {message && <p role="alert">{message}</p>}</form></section>;
}
