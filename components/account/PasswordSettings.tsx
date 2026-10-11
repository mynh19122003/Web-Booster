"use client";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
export type PasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string };
export function PasswordSettings({ values, onChange, disabled }: { values: PasswordValues; onChange: (values: PasswordValues) => void; disabled: boolean }) {
  const { text } = useLanguage();
  const [visible, setVisible] = useState(false);
  const changing = Object.values(values).some(Boolean);
  return <section className="profile-settings-password">
    <div className="profile-settings-form-title"><div><h2><LockKeyhole size={18} />{text("Change password", "Đổi mật khẩu")}</h2><p>{text("Optional. Leave these fields empty to keep your current password.", "Tùy chọn. Để trống các trường này nếu bạn không muốn đổi mật khẩu.")}</p></div><button type="button" className="button ghost" disabled={disabled} onClick={() => setVisible(value => !value)} aria-pressed={visible}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}{visible ? text("Hide", "Ẩn") : text("Show", "Hiện")}</button></div>
    <fieldset disabled={disabled}>
      {([
        ["currentPassword", text("Current password", "Mật khẩu hiện tại"), "current-password"],
        ["newPassword", text("New password", "Mật khẩu mới"), "new-password"],
        ["confirmPassword", text("Confirm new password", "Xác nhận mật khẩu mới"), "new-password"],
      ] as const).map(([key, label, autocomplete]) => <label key={key} className={key === "currentPassword" ? "profile-settings-wide" : undefined}><span>{label}{changing ? " *" : ""}</span><input type={visible ? "text" : "password"} autoComplete={autocomplete} required={changing} minLength={key === "currentPassword" ? 1 : 8} maxLength={128} value={values[key]} onChange={event => onChange({ ...values, [key]: event.target.value })} /></label>)}
    </fieldset>
    <small className="profile-password-hint">{text("8–128 characters. Other devices will be signed out after you change your password.", "Từ 8–128 ký tự. Các thiết bị khác sẽ đăng xuất sau khi đổi mật khẩu.")}</small>
  </section>;
}
