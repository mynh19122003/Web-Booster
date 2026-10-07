"use client";
import { useState } from "react";
import { useLanguage } from "@/components/ui/LanguageProvider";
export function SupportForm() {
  const { t } = useLanguage();
  const [done, setDone] = useState(false);
  return (
    <form
      className="support-form"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <h2>{t("howCanHelp")}</h2>
      <label>
        {t("yourEmail")}
        <input required type="email" placeholder="you@example.com" />
      </label>
      <label>
        {t("howCanHelp")}
        <textarea
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder={t("supportQuestionHint")}
        />
      </label>
      <button className="button" type="submit">
        {t("sendMessage")}
      </button>
      {done && (
        <p role="status">
          {t("supportDraftSaved")}
        </p>
      )}
    </form>
  );
}
