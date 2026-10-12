"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { ProfileAvatarSection } from "@/components/ProfileAvatarSection";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import type { CoachProfileOverride } from "@/lib/coach-profile-db";
import { notifyCoachProfileUpdated } from "@/lib/coach-profile-events";
import { coachLanguageOptions, coachRoleOptions, normalizeCoachLanguages } from "@/lib/coach-options";
import { ProfileChecklist } from "@/components/coaches/ProfileChecklist";
import { CoachDataLoading } from "./CoachDataLoading";

type CoachProfileEditorProps = {
  slug: string;
  coachName: string;
  game: string;
  server: string;
  initialOverride?: CoachProfileOverride | null;
  onProfileUpdated?: (updated: CoachProfileOverride | null) => void;
  privileged?: boolean;
  avatarFallback?: string;
  initialOpen?: boolean;
};

type BaseCoachData = {
  online: boolean;
  hourlyRate: number;
  isMvp: boolean;
  rating: number;
  reviewCount: number;
  languages: string[];
  roles: string[];
  sessionFormats: ("live" | "vod")[];
};

export function CoachProfileEditor({
  slug,
  coachName,
  game,
  onProfileUpdated,
  privileged = false,
  avatarFallback,
  initialOpen = false,
}: CoachProfileEditorProps) {
  const { language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);

  const [base, setBase] = useState<BaseCoachData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [isMvp, setIsMvp] = useState<boolean>(false);
  const [sessionLive, setSessionLive] = useState<boolean>(true);
  const [sessionVod, setSessionVod] = useState<boolean>(true);
  const [rating, setRating] = useState<string>("");
  const [reviewCount, setReviewCount] = useState<string>("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [bioOverride, setBioOverride] = useState<string>("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);
  const [busy, setBusy] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);

  function applyData(baseData: BaseCoachData, overrideData: CoachProfileOverride | null | undefined) {
    setBase(baseData);
    if (overrideData) {
      setHourlyRate(overrideData.hourlyRate !== null && overrideData.hourlyRate !== undefined ? String(overrideData.hourlyRate) : "");
      setIsMvp(overrideData.isMvp !== null && overrideData.isMvp !== undefined ? overrideData.isMvp : baseData.isMvp);
      setSessionLive(overrideData.sessionLive !== null && overrideData.sessionLive !== undefined ? overrideData.sessionLive : baseData.sessionFormats.includes("live"));
      setSessionVod(overrideData.sessionVod !== null && overrideData.sessionVod !== undefined ? overrideData.sessionVod : baseData.sessionFormats.includes("vod"));
      setRating(overrideData.rating !== null && overrideData.rating !== undefined ? String(overrideData.rating) : "");
      setReviewCount(overrideData.reviewCount !== null && overrideData.reviewCount !== undefined ? String(overrideData.reviewCount) : "");
      setLanguages(normalizeCoachLanguages(overrideData.languages ?? baseData.languages));
      setRoles(overrideData.roles ?? baseData.roles);
      setBioOverride(overrideData.bioOverride ?? "");
      setAvatarPreview(overrideData.avatar ?? null);
    } else {
      setHourlyRate("");
      setIsMvp(baseData.isMvp);
      setSessionLive(baseData.sessionFormats.includes("live"));
      setSessionVod(baseData.sessionFormats.includes("vod"));
      setRating("");
      setReviewCount("");
      setLanguages(normalizeCoachLanguages(baseData.languages));
      setRoles(baseData.roles);
      setBioOverride("");
      setAvatarPreview(null);
    }
  }

  useEffect(() => {
    let ignore = false;
    fetch(`/api/employee/coaches/${slug}/profile`, { cache: "no-store" })
      .then(res => { if (!res.ok) throw new Error("load-failed"); return res.json(); })
      .then(data => { if (!data?.base) throw new Error("load-failed"); if (!ignore) applyData(data.base, data.override); })
      .catch(() => { if (!ignore) setLoadFailed(true); });
    return () => { ignore = true; };
  }, [slug, loadAttempt]);

  async function saveAvatar(file: File | null) {
    setBusy(true); setMessage(""); setIsError(false);
    try {
      const form = new FormData();
      if (file) form.append("file", file);
      const response = await fetch(`/api/employee/coaches/${slug}/avatar`, { method: file ? "POST" : "DELETE", ...(file ? { body: form } : {}) });
      const data = await response.json();
      if (!response.ok) throw new Error("avatar-save-failed");
      setAvatarPreview(data.override?.avatar ?? null);
      onProfileUpdated?.(data.override);
      notifyCoachProfileUpdated();
      setMessage(text("Profile photo saved.", "Đã lưu ảnh hồ sơ."));
    } catch {
      setIsError(true);
      setMessage(text("Could not save photo. Please try again.", "Không thể lưu ảnh. Vui lòng thử lại."));
      throw new Error("avatar-save-failed");
    } finally { setBusy(false); }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (busy || !base) return;
    setBusy(true); setMessage(""); setIsError(false);
    try {
      const payload: Record<string, unknown> = {
        hourlyRate: hourlyRate.trim() ? Number(hourlyRate) : null,
        sessionLive, sessionVod,
        languages,
        roles,
        bioOverride: bioOverride.trim() ? bioOverride.trim() : null,
      };
      if (privileged) Object.assign(payload, { isMvp, rating: rating.trim() ? Number(rating) : null, reviewCount: reviewCount.trim() ? Number(reviewCount) : null });
      const res = await fetch(`/api/employee/coaches/${slug}/profile`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        setIsError(true); setMessage(text("Failed to save profile. Please check inputs.", "Không thể lưu thông tin. Vui lòng kiểm tra dữ liệu."));
        return;
      }
      setMessage(text("Profile saved successfully.", "Đã lưu thông tin hồ sơ thành công."));
      onProfileUpdated?.(data.override);
      notifyCoachProfileUpdated();
    } catch {
      setIsError(true); setMessage(text("Network error. Please try again.", "Lỗi mạng. Vui lòng thử lại."));
    } finally { setBusy(false); }
  }

  async function handleReset() {
    if (busy) return;
    if (!window.confirm(text(`Reset all custom profile settings for ${coachName} to default?`, `Khôi phục toàn bộ cài đặt hồ sơ của ${coachName} về mặc định?`))) return;
    setBusy(true); setMessage(""); setIsError(false);
    try {
      const res = await fetch(`/api/employee/coaches/${slug}/profile`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({reset:true}) });
      await res.json();
      if (!res.ok) {
        setIsError(true); setMessage(text("Failed to reset profile.", "Không thể khôi phục hồ sơ."));
        return;
      }
      if (base) applyData(base,null);
      setMessage(text("Profile reset to defaults.", "Đã khôi phục hồ sơ về mặc định."));
      onProfileUpdated?.(null);
      notifyCoachProfileUpdated();
    } catch {
      setIsError(true); setMessage(text("Network error. Please try again.", "Lỗi mạng. Vui lòng thử lại."));
    } finally { setBusy(false); }
  }

  return (
    <div className="coach-profile-editor">
      <div className="coach-section-divider" />
      <div className="coach-section-title">
        <span>{text("Profile settings", "Cài đặt hồ sơ")}</span>
        <button type="button" className="coach-btn-secondary coach-editor-toggle" aria-expanded={isOpen} aria-controls={`${slug}-profile-editor`} onClick={() => setIsOpen(prev => !prev)}>
          {isOpen ? text("Collapse", "Thu gọn") : text("Edit profile", "Chỉnh sửa hồ sơ")}
        </button>
      </div>

      {isOpen && (
        <form id={`${slug}-profile-editor`} onSubmit={handleSave} className="coach-profile-form" aria-busy={busy}>
          <p className="coach-editor-help">{base ? text("Leave a field empty to keep its default value. Changes appear on the public coach profile after saving.", "Để trống trường để dùng giá trị mặc định. Thay đổi sẽ hiển thị trên hồ sơ công khai sau khi lưu.") : text("Loading profile settings…", "Đang tải cài đặt hồ sơ…")}</p>
          {!base && (loadFailed ? <div role="alert"><p>{text("Could not load profile settings.", "Không tải được cài đặt hồ sơ.")}</p><button type="button" className="coach-btn-secondary" onClick={() => { setLoadFailed(false); setLoadAttempt(value => value + 1); }}>{text("Retry", "Thử lại")}</button></div> : <CoachDataLoading label={text("Loading profile settings…", "Đang tải cài đặt hồ sơ…")} />)}
          <fieldset className="coach-editor-fields" disabled={busy || !base}>
            <div className="coach-editor-sections">
              <section className="coach-editor-section">
                <h3>{text("Profile photo", "Ảnh hồ sơ")}</h3>
                <ProfileAvatarSection avatar={avatarPreview || avatarFallback || `/images/coaches/${slug}.svg`} name={coachName} hasCustomPhoto={Boolean(avatarPreview)} disabled={busy || !base} onSave={saveAvatar} />
              </section>

              <section className="coach-editor-section">
                <h3>{text("Availability & badge", "Trạng thái & huy hiệu")}</h3>
                <p className="coach-editor-help">{text("Use the switch beside your name to start or stop accepting coaching. The status saves immediately.", "Dùng nút cạnh tên để bật/tắt nhận coaching. Trạng thái được lưu ngay.")}</p>
                <label className="coach-checkbox-label coach-editor-badge"><input type="checkbox" disabled={!privileged} checked={isMvp} onChange={event => setIsMvp(event.target.checked)} /><span>{text("MVP Coach badge", "Huy hiệu MVP Coach")}</span></label>
                {!privileged && <small className="coach-editor-help">{text("Ratings, review counts and badges are managed by the system.", "Điểm đánh giá, số review và huy hiệu do hệ thống quản lý.")}</small>}
              </section>

              <section className="coach-editor-section">
                <h3>{text("Pricing & reviews", "Giá & đánh giá")}</h3>
                <div className="coach-profile-grid-3">
                  <label>{text("Hourly rate ($/hr)", "Giá mỗi giờ ($/giờ)")}<input type="number" min={1} max={500} step={1} value={hourlyRate} placeholder={base ? `${base.hourlyRate} (${text("default", "mặc định")})` : "USD"} onChange={event => setHourlyRate(event.target.value)} /></label>
                  <label>{text("Rating (1–5)", "Điểm đánh giá (1–5)")}<input disabled={!privileged} type="number" min={1} max={5} step={0.01} value={rating} placeholder={base ? base.rating.toFixed(2) : "4.98"} onChange={event => setRating(event.target.value)} /></label>
                  <label>{text("Review count", "Số lượt đánh giá")}<input disabled={!privileged} type="number" min={0} max={100000} step={1} value={reviewCount} placeholder={base ? String(base.reviewCount) : "100"} onChange={event => setReviewCount(event.target.value)} /></label>
                </div>
              </section>

              <section className="coach-editor-section">
                <h3>{text("Coaching sessions", "Buổi coaching")}</h3>
                <fieldset className="coach-editor-choice-group">
                  <legend>{text("Session formats", "Hình thức buổi học")}</legend>
                  <div className="coach-editor-formats">
                    <label className="coach-checkbox-label"><input type="checkbox" checked={sessionLive} onChange={event => setSessionLive(event.target.checked)} /><span>{text("Live session", "Học trực tiếp")}</span></label>
                    <label className="coach-checkbox-label"><input type="checkbox" checked={sessionVod} onChange={event => setSessionVod(event.target.checked)} /><span>{text("VOD review", "Phân tích replay")}</span></label>
                  </div>
                </fieldset>
              </section>

              <section className="coach-editor-section coach-editor-details">
                <h3>{text("Expertise & introduction", "Chuyên môn & giới thiệu")}</h3>
                <div className="coach-profile-grid-2">
                  <ProfileChecklist label={text("Roles", "Vai trò")} options={coachRoleOptions(game)} selected={roles} onChange={setRoles} />
                  <ProfileChecklist label={text("Languages", "Ngôn ngữ")} options={coachLanguageOptions} selected={languages} onChange={setLanguages} />
                </div>
                <small className="coach-editor-help">{text("Select the roles and languages you offer.", "Chọn vai trò và ngôn ngữ bạn hỗ trợ.")}</small>
                <div className="coach-textarea-wrap">
                  <label htmlFor={`${slug}-coach-bio`}>{text("Introduction", "Giới thiệu")}</label>
                  <textarea id={`${slug}-coach-bio`} aria-describedby={`${slug}-bio-count`} value={bioOverride} onChange={event => setBioOverride(event.target.value)} maxLength={1000} rows={4} placeholder={text("Leave empty to use the default introduction.", "Để trống để dùng phần giới thiệu mặc định.")} />
                  <div className="coach-char-count" id={`${slug}-bio-count`}>{bioOverride.length} / 1000</div>
                </div>
              </section>
            </div>
          </fieldset>

          <div className="coach-actions-row">
            {privileged && <button type="button" className="coach-btn-secondary" onClick={handleReset} disabled={busy || !base}>{text("Reset to defaults", "Khôi phục mặc định")}</button>}
            <button type="submit" className="coach-editor-save" disabled={busy || !base} aria-busy={busy}>{busy && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}{busy ? text("Saving…", "Đang lưu…") : text("Save profile", "Lưu hồ sơ")}</button>
          </div>
          {message && <p className="coach-editor-message" role={isError ? "alert" : "status"} data-error={isError}>{message}</p>}
        </form>
      )}
    </div>
  );
}
