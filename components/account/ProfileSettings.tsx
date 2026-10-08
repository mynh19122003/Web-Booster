"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Check, LoaderCircle, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { intlLocales } from "@/lib/i18n";
import type { UserProfile } from "@/lib/auth-db";

export function ProfileSettings() {
  const { language, t, text } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState<UserProfile | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([intlLocales[language]], { type: "region" });
    return Array.from({ length: 676 }, (_, i) => String.fromCharCode(65 + Math.floor(i / 26), 65 + i % 26)).filter(code => names.of(code) !== code && !["EU", "UN", "EZ", "XA", "XB", "ZZ", "AC", "CP", "DG", "EA", "IC", "TA"].includes(code)).map(code => ({ code, name: names.of(code)! })).sort((a, b) => a.name.localeCompare(b.name, intlLocales[language]));
  }, [language]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/profile", { cache: "no-store", signal: controller.signal }).then(async response => {
      if (response.status === 401) { setState("unauthorized"); return; }
      if (!response.ok) throw new Error();
      const result = await response.json(); setProfile(result.profile); setSaved(result.profile); setState("ready");
    }).catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, []);
  const dirty = JSON.stringify(profile) !== JSON.stringify(saved);
  function change(key: keyof UserProfile, value: string) { setProfile(current => current ? { ...current, [key]: value } : current); setNotice(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!profile || saving || !dirty) return;
    setSaving(true); setNotice("");
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      const result = await response.json();
      if (response.status === 401) { setState("unauthorized"); return; }
      if (!response.ok) { setNotice(result.error || "save-failed"); return; }
      setProfile(result.profile); setSaved(result.profile); setNotice("saved");
      window.dispatchEvent(new Event("ascend-profile-updated"));
    } catch { setNotice("save-failed"); } finally { setSaving(false); }
  }
  const errors: Record<string, string> = {
    "invalid-name": text("Enter your full name (at least 2 characters).", "Nhập họ tên từ 2 đến 80 ký tự."),
    "invalid-phone": text("Enter a valid phone number.", "Vui lòng nhập số điện thoại hợp lệ."),
    "invalid-country": text("Choose your country.", "Vui lòng chọn quốc gia."),
    "invalid-discord": text("Discord name is too long.", "Tên Discord không được quá 80 ký tự."),
  };
  return <>
    <Link href="/services" className="wallet-page-back"><ArrowLeft size={15} />{text("Back to services", "Quay lại dịch vụ")}</Link>
    <header className="profile-settings-heading"><span><UserRound size={25} /></span><div><h1>{text("Profile settings", "Cài đặt hồ sơ")}</h1><p>{text("Manage your personal information and contact details.", "Cập nhật thông tin cá nhân và thông tin liên hệ của bạn.")}</p></div></header>
    {state === "loading" ? <p className="profile-settings-status" role="status"><LoaderCircle className="profile-settings-spinner" size={20} />{text("Loading…", "Đang tải…")}</p> : state === "unauthorized" ? <section className="profile-settings-card"><h2>{text("Sign in to manage your profile", "Đăng nhập để cập nhật hồ sơ")}</h2><Link className="button" href="/login?next=%2Fprofile">{text("Sign in", "Đăng nhập")}</Link></section> : state === "error" ? <p role="alert">{text("Could not load your profile. Please try again.", "Không tải được hồ sơ. Vui lòng thử lại.")}</p> : profile && <div className="profile-settings-grid">
      <aside className="profile-settings-card profile-settings-summary"><span className="profile-settings-avatar">{profile.name.trim().charAt(0).toUpperCase()}</span><h2>{profile.name}</h2><p><Mail size={15} />{profile.email}</p><div><ShieldCheck size={20} /><span>{text("Your account", "Tài khoản của bạn")}<small>{text("Keep your details up to date for your orders and coaching sessions.", "Cập nhật thông tin để thuận tiện trao đổi về đơn hàng và buổi coaching.")}</small></span></div></aside>
      <form className="profile-settings-card profile-settings-form" onSubmit={submit} aria-busy={saving}>
        <div className="profile-settings-form-title"><h2>{text("Personal information", "Thông tin cá nhân")}</h2><p>{text("Contact details are optional.", "Thông tin liên hệ là tùy chọn.")}</p></div>
        <fieldset disabled={saving}>
          <label><span>{t("fullName")} *</span><input required minLength={2} maxLength={80} autoComplete="name" value={profile.name} onChange={e => change("name", e.target.value)} /></label>
          <label><span>{text("Email address", "Địa chỉ email")}</span><input type="email" readOnly autoComplete="email" value={profile.email} /><small>{text("This email is linked to your sign-in account.", "Email này được liên kết với tài khoản đăng nhập.")}</small></label>
          <label><span>{t("phoneNumber")}<small>{text("Optional", "Tùy chọn")}</small></span><input type="tel" autoComplete="tel" maxLength={30} placeholder="+84 912 345 678" value={profile.phone} onChange={e => change("phone", e.target.value)} /></label>
          <label><span>{text("Country / region", "Quốc gia / khu vực")}<small>{text("Optional", "Tùy chọn")}</small></span><select autoComplete="country" value={profile.country} onChange={e => change("country", e.target.value)}><option value="">{text("Choose your country", "Chọn quốc gia")}</option>{countries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
          <label className="profile-settings-wide"><span>Discord<small>{text("Optional", "Tùy chọn")}</small></span><input maxLength={80} autoComplete="off" placeholder="username" value={profile.discord} onChange={e => change("discord", e.target.value)} /></label>
        </fieldset>
        <div className="profile-settings-actions"><button type="button" className="button ghost" disabled={saving || !dirty} onClick={() => { setProfile(saved); setNotice(""); }}>{text("Cancel", "Hủy thay đổi")}</button><button className="button" type="submit" disabled={saving || !dirty}>{saving ? <LoaderCircle size={17} className="profile-settings-spinner" /> : <Check size={17} />}{saving ? text("Saving…", "Đang lưu…") : text("Save changes", "Lưu thay đổi")}</button></div>
        {notice && <p className="profile-settings-notice" data-success={notice === "saved"} role={notice === "saved" ? "status" : "alert"}>{notice === "saved" ? text("Your profile has been updated.", "Hồ sơ đã được cập nhật.") : errors[notice] ?? text("Could not save your profile. Please try again.", "Không lưu được hồ sơ. Vui lòng thử lại.")}</p>}
      </form>
    </div>}
  </>;
}
