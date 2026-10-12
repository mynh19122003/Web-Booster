"use client";
import { publicRequest } from "@/services/public";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import type { AuthUser } from "@/lib/auth-db";

export function SupportForm() {
  const { t, language } = useLanguage();
  const copy = (english: string, vietnamese: string) => translateText(language, english, vietnamese);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    publicRequest("/api/auth/me", { cache: "no-store", signal: controller.signal })
      .then(response => response.json()).then(result => { if (!controller.signal.aborted) { setUser(result.user); setLoaded(true); } })
      .catch(() => { if (!controller.signal.aborted) setLoaded(true); });
    return () => controller.abort();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError(false);
    try {
      const response = await publicRequest("/api/requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: form.get("subject"), game: "Other", text: form.get("text") }),
      });
      if (!response.ok) throw new Error("Unable to send");
      setDone(true);
    } catch { setError(true); }
    finally { setBusy(false); }
  }
  return <form className="support-form" onSubmit={submit}>
    <h2>{t("howCanHelp")}</h2>
    {!loaded ? <p role="status">{copy("Loading…", "Đang tải…")}</p>
      : !user ? <><p>{copy("Sign in to send a request and receive replies from our team.", "Đăng nhập để gửi yêu cầu và nhận phản hồi từ nhân viên.")}</p><Link className="button" href="/login?next=/support">{t("signIn")}</Link></>
        : user.role === "employee" ? <Link className="button" href="/employee">{copy("Open employee workspace", "Mở khu vực nhân viên")}</Link>
          : done ? <><p role="status">{copy("Your request has been sent to our team.", "Yêu cầu đã được gửi đến đội ngũ hỗ trợ.")}</p><Link className="button" href="/messages">{copy("View conversations", "Xem hội thoại")}</Link></>
            : <><label>{t("yourEmail")}<input type="email" value={user.email} readOnly /></label><label>{copy("Subject", "Tiêu đề")}<input name="subject" required minLength={3} maxLength={120} /></label><label>{t("howCanHelp")}<textarea name="text" required minLength={10} maxLength={2000} rows={5} placeholder={t("supportQuestionHint")} /></label><button className="button" type="submit" disabled={busy}>{busy ? copy("Sending…", "Đang gửi…") : t("sendMessage")}</button>{error && <p role="alert">{copy("Unable to send. Check your connection and sign-in, then try again.", "Chưa thể gửi. Kiểm tra kết nối và phiên đăng nhập, sau đó thử lại.")}</p>}</>}
  </form>;
}
