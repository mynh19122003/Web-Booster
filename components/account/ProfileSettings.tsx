"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Check, LoaderCircle, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { intlLocales } from "@/lib/i18n";
import type { UserProfile } from "@/lib/auth-db";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { headerPhoneCountries } from "@/lib/phone-countries";
import { PasswordSettings, type PasswordValues } from "./PasswordSettings";

export function ProfileSettings() {
  const { language, t, text } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saved, setSaved] = useState<UserProfile | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [notice, setNotice] = useState("");
  const [passwords, setPasswords] = useState<PasswordValues>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([intlLocales[language]], { type: "region" });
    return headerPhoneCountries.map(({ code }) => ({ code: code.toUpperCase(), name: names.of(code.toUpperCase())! })).sort((a, b) => a.name.localeCompare(b.name, intlLocales[language]));
  }, [language]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/profile", { cache: "no-store", signal: controller.signal }).then(async response => {
      if (response.status === 401) { setState("unauthorized"); return; }
      if (!response.ok) throw new Error();
      const result = await response.json(); setProfile(result.profile); setSaved(result.profile); setState("ready");
    }).catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, [loadAttempt]);
  const changingPassword = Object.values(passwords).some(Boolean);
  const dirty = JSON.stringify(profile) !== JSON.stringify(saved) || changingPassword;
  function change(key: keyof UserProfile, value: string) { setProfile(current => current ? { ...current, [key]: value } : current); setNotice(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!profile || saving || !dirty) return;
    if (changingPassword && passwords.newPassword !== passwords.confirmPassword) { setNotice("mismatch"); return; }
    setSaving(true); setNotice("");
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...profile, ...(changingPassword ? { password: { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword } } : {}) }) });
      const result = await response.json();
      if (response.status === 401) { setState("unauthorized"); return; }
      if (!response.ok) { setNotice(result.error || "save-failed"); return; }
      setProfile(result.profile); setSaved(result.profile); setEditing(false); setNotice("saved");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      window.dispatchEvent(new Event("ascend-profile-updated"));
    } catch { setNotice("save-failed"); } finally { setSaving(false); }
  }
  const errors: Record<string, string> = {
    "mismatch": text("The new passwords do not match.", "Mật khẩu mới và xác nhận chưa khớp."),
    "same-password": text("Choose a different new password.", "Mật khẩu mới phải khác mật khẩu hiện tại."),
    "incorrect-password": text("Your current password is incorrect.", "Mật khẩu hiện tại không chính xác."),
    "invalid-password": text("Use between 8 and 128 characters for your new password.", "Mật khẩu mới cần từ 8 đến 128 ký tự."),
    "external-account": text("Manage your password in your Google account.", "Vui lòng quản lý mật khẩu trong tài khoản Google."),
    "invalid-name": text("Enter your full name (at least 2 characters).", "Nhập họ tên từ 2 đến 80 ký tự."),
    "invalid-phone": text("Enter a valid phone number.", "Vui lòng nhập số điện thoại hợp lệ."),
    "invalid-country": text("Choose your country.", "Vui lòng chọn quốc gia."),
    "invalid-discord": text("Discord name is too long.", "Tên Discord không được quá 80 ký tự."),
  };
  return <>
    <Link href="/services" className="wallet-page-back"><ArrowLeft size={15} />{text("Back to services", "Quay lại dịch vụ")}</Link>
    <header className="profile-settings-heading"><span><UserRound size={25} /></span><div><h1>{text("Profile settings", "Cài đặt hồ sơ")}</h1><p>{text("Manage your personal information and contact details.", "Cập nhật thông tin cá nhân và thông tin liên hệ của bạn.")}</p></div></header>
    {state === "loading" ? <p className="profile-settings-status" role="status"><LoaderCircle className="profile-settings-spinner" size={20} />{text("Loading…", "Đang tải…")}</p> : state === "unauthorized" ? <section className="profile-settings-card"><h2>{text("Sign in to manage your profile", "Đăng nhập để cập nhật hồ sơ")}</h2><Link className="button" href="/login?next=%2Fprofile">{text("Sign in", "Đăng nhập")}</Link></section> : state === "error" ? <section className="profile-settings-card profile-settings-load-error" role="alert"><p>{text("Could not load your profile. Please try again.", "Không tải được hồ sơ. Vui lòng thử lại.")}</p><button type="button" className="button" onClick={() => { setState("loading"); setLoadAttempt(value => value + 1); }}>{text("Try again", "Thử lại")}</button></section> : profile && <div className="profile-settings-grid">
      <aside className="profile-settings-card profile-settings-summary"><span className="profile-settings-avatar">{profile.name.trim().charAt(0).toUpperCase()}</span><h2>{profile.name}</h2><p><Mail size={15} />{profile.email}</p><div><ShieldCheck size={20} /><span>{text("Your account", "Tài khoản của bạn")}<small>{text("Keep your details up to date for your orders and coaching sessions.", "Cập nhật thông tin để thuận tiện trao đổi về đơn hàng và buổi coaching.")}</small></span></div></aside>
      <form className="profile-settings-card profile-settings-form" onSubmit={submit} aria-busy={saving}>
        <div className="profile-settings-form-title"><div><h2>{text("Personal information", "Thông tin cá nhân")}</h2><p>{editing ? text("Update the details used for your orders and coaching sessions.", "Cập nhật thông tin dùng cho đơn hàng và buổi coaching.") : text("Review the details saved to your account.", "Xem thông tin đã lưu trong tài khoản của bạn.")}</p></div>{!editing && <button type="button" className="button profile-settings-edit" onClick={() => { setEditing(true); setNotice(""); }}>{text("Edit information", "Chỉnh sửa thông tin")}</button>}</div>
        <fieldset disabled={saving || !editing}>
          <label><span>{t("fullName")} *</span><input required minLength={2} maxLength={80} autoComplete="name" value={profile.name} onChange={e => change("name", e.target.value)} /></label>
          <label><span>{text("Email address", "Địa chỉ email")}</span><input type="email" readOnly autoComplete="email" value={profile.email} /><small>{text("Used to sign in. Contact support if you need to change it.", "Dùng để đăng nhập. Vui lòng liên hệ hỗ trợ nếu bạn cần đổi email.")}</small></label>
          <PhoneNumberField countries={headerPhoneCountries} value={profile.phone} onChange={value => change("phone", value)} />
          <label><span>{text("Country / region", "Quốc gia / khu vực")}<small>{text("Optional", "Tùy chọn")}</small></span><select autoComplete="country" value={profile.country} onChange={e => change("country", e.target.value)}><option value="">{text("Choose your country", "Chọn quốc gia")}</option>{countries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
          <label className="profile-settings-wide"><span>Discord<small>{text("Optional", "Tùy chọn")}</small></span><input maxLength={80} autoComplete="off" placeholder="username" value={profile.discord} onChange={e => change("discord", e.target.value)} /></label>
        </fieldset>
        <PasswordSettings values={passwords} onChange={values => { setPasswords(values); setNotice(""); }} disabled={saving || !editing} />
        {editing && <div className="profile-settings-actions"><button type="button" className="button ghost" disabled={saving} onClick={() => { setProfile(saved); setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" }); setEditing(false); setNotice(""); }}>{text("Cancel", "Hủy")}</button><button className="button" type="submit" disabled={saving || !dirty}>{saving ? <LoaderCircle size={17} className="profile-settings-spinner" /> : <Check size={17} />}{saving ? text("Saving…", "Đang lưu…") : text("Save changes", "Lưu thay đổi")}</button></div>}
        {notice && <p className="profile-settings-notice" data-success={notice === "saved"} role={notice === "saved" ? "status" : "alert"}>{notice === "saved" ? text("Your profile has been updated.", "Hồ sơ đã được cập nhật.") : errors[notice] ?? text("Could not save your profile. Please try again.", "Không lưu được hồ sơ. Vui lòng thử lại.")}</p>}
      </form>
    </div>}
  </>;
}
