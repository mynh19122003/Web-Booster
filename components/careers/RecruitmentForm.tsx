"use client";
import { translateText } from "@/lib/i18n";

import { useId, useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, RotateCcw } from "lucide-react";
import { games } from "@/data/games";
import { ranksFor } from "@/lib/service-options";
import { addApplication } from "@/lib/local-records";
import Link from "next/link";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { useLanguage } from "@/components/ui/LanguageProvider";

const inputStyles =
  "w-full min-h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-500 transition-all duration-200 hover:border-white/20 focus:border-[#FF9F3C] focus:ring-1 focus:ring-[#FF9F3C]/50 focus:outline-none";

const labelStyles = "flex flex-col gap-2 text-xs font-semibold text-zinc-300";

export function RecruitmentForm() {
  const { language, t } = useLanguage();
  const formId = useId();
  const [game, setGame] = useState(games[0].slug);
  const [savedId, setSavedId] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function errorMessage(field: string) {
    const messages: Record<string, [string, string]> = {
      name: ["Enter your full name (at least 2 characters).", "Nhập họ tên (ít nhất 2 ký tự)."],
      email: ["Enter a valid email address.", "Nhập địa chỉ email hợp lệ."],
      rank: ["Choose your current rank.", "Chọn rank hiện tại của bạn."],
      profile: ["Enter a complete link starting with https://.", "Nhập liên kết đầy đủ, bắt đầu bằng https://."],
      consent: ["Please agree to the application review terms.", "Vui lòng đồng ý lưu thông tin để xét duyệt hồ sơ."],
    };
    const message = messages[field];
    return message ? translateText(language, message[0], message[1]) : t("recruitmentInvalid");
  }
  function fieldError(field: string) {
    return fieldErrors[field] && <span id={`${formId}-${field}-error`} className="recruitment-field-error">{fieldErrors[field]}</span>;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const invalidFields: Record<string, string> = {};
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea").forEach((field) => {
      if (field.willValidate && !field.validity.valid && field.name !== "phone-national") invalidFields[field.name] = errorMessage(field.name);
    });
    const fullName = form.elements.namedItem("name") as HTMLInputElement;
    if (fullName.value.trim().length < 2) invalidFields.name = errorMessage("name");
    setFieldErrors(invalidFields);
    if (!form.checkValidity() || Object.keys(invalidFields).length > 0) {
      setError(translateText(language, "Please check the highlighted fields below.", "Vui lòng kiểm tra các trường được đánh dấu bên dưới."));
      const firstInvalid = invalidFields.name ? fullName : form.querySelector<HTMLInputElement | HTMLSelectElement>(":invalid") ?? fullName;
      firstInvalid.focus();
      return;
    }
    const values = new FormData(form);
    const name = String(values.get("name") || "").trim();
    const email = String(values.get("email") || "").trim();
    const phone = String(values.get("phone") || "").trim();
    const rank = String(values.get("rank") || "");
    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      (phone !== "" &&
        (!/^[+\d\s().-]{7,25}$/.test(phone) ||
          phone.replace(/\D/g, "").length < 7)) ||
      !ranksFor(game).includes(rank) ||
      values.get("consent") !== "on"
    ) {
      setError(t("recruitmentInvalid"));
      return;
    }
    try {
      const application = addApplication({
        name,
        email,
        phone,
        game,
        rank,
        message: [
          String(values.get("message") || "").trim(),
          values.get("availability")
            ? `Availability: ${values.get("availability")}`
            : "",
          values.get("profile") ? `Profile: ${values.get("profile")}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      });
      setSavedId(application.id);
      setError("");
      form.reset();
    } catch {
      setError(t("recruitmentStorageError"));
    }
  }

  if (savedId)
    return (
      <div
        className="application-success flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
        role="status"
      >
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          {t("recruitmentReceived")}
        </h3>
        <p className="text-sm text-zinc-300 max-w-md mb-6 leading-relaxed">
          {t("applicationReference")}{" "}
          <span className="font-mono text-[#FF9F3C] font-semibold">
            {savedId}
          </span>

        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF9F3C] hover:text-[#f8b15d] transition-colors py-2 px-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer"
          onClick={() => setSavedId("")}
        >
          <RotateCcw size={14} /> {t("submitAnotherApplication")}
        </button>
      </div>
    );

  return (
    <form className="recruitment-form space-y-6" noValidate onInvalidCapture={(event) => event.preventDefault()} onSubmit={submit} onInput={(event) => {
      const field = event.target as HTMLInputElement;
      if (fieldErrors[field.name] && field.validity.valid && (field.name !== "name" || field.value.trim().length >= 2)) setFieldErrors((previous) => {
        const next = { ...previous }; delete next[field.name]; return next;
      });
      if (error) setError("");
    }}>
      <div>
        <h3 className="text-xl sm:text-2xl font-heading font-bold uppercase tracking-wider text-white mb-1.5">
          {t("applyToJoin")}
        </h3>
        <p className="text-xs text-zinc-400">
          {t("requiredFields")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <label className={labelStyles}>
          <span>{t("fullNameRequired")}</span>
          <input
            name="name"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? `${formId}-name-error` : undefined}
            aria-label={t("fullName")}
            autoComplete="name"
            placeholder={t("yourFullName")}
            required
            minLength={2}
            maxLength={80}
            className={inputStyles}
          />
          {fieldError("name")}
        </label>

        <label className={labelStyles}>
          <span>{t("emailRequired")}</span>
          <input
            name="email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? `${formId}-email-error` : undefined}
            aria-label={t("emailAddress")}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength={120}
            className={inputStyles}
          />
          {fieldError("email")}
        </label>

        <label className={labelStyles}>
          <span>{t("gameRequired")}</span>
          <select
            name="game"
            aria-label={t("games")}
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className={`${inputStyles} cursor-pointer [&>option]:bg-[#121316]/95 backdrop-blur-2xl [&>option]:text-white`}
          >
            {games.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelStyles}>
          <span>{t("currentRankRequired")}</span>
          <select
            name="rank"
            aria-invalid={Boolean(fieldErrors.rank)}
            aria-describedby={fieldErrors.rank ? `${formId}-rank-error` : undefined}
            aria-label={t("currentRankRequired")}
            key={game}
            required
            defaultValue=""
            className={`${inputStyles} cursor-pointer [&>option]:bg-[#121316]/95 backdrop-blur-2xl [&>option]:text-white`}
          >
            <option value="" disabled className="text-zinc-600">
              {t("selectYourRank")}
            </option>
            {ranksFor(game).map((rank) => (
              <option key={rank} value={rank}>
                {rank}
              </option>
            ))}
          </select>
          {fieldError("rank")}
        </label>

        <label className={labelStyles}>
          <div className="flex items-center justify-between">
            <span>{t("availability")}</span>
            <span className="text-[11px] font-normal text-zinc-500">
              {t("optional")}
            </span>
          </div>
          <input
            name="availability"
            aria-label={t("availability")}
            placeholder={t("availabilityExample")}
            maxLength={160}
            className={inputStyles}
          />
        </label>

        <PhoneNumberField />

        <label className={`${labelStyles} sm:col-span-2`}>
          <div className="flex items-center justify-between">
            <span>{t("playerProfile")}</span>
            <span className="text-[11px] font-normal text-zinc-500">
              {t("optional")}
            </span>
          </div>
          <input
            name="profile"
            aria-invalid={Boolean(fieldErrors.profile)}
            aria-describedby={fieldErrors.profile ? `${formId}-profile-error` : undefined}
            aria-label={t("playerProfile")}
            type="url"
            placeholder="https://tracker.gg/... or op.gg/..."
            maxLength={500}
            className={inputStyles}
          />
          {fieldError("profile")}
        </label>

        <label className={`${labelStyles} sm:col-span-2`}>
          <div className="flex items-center justify-between">
            <span>{t("experience")}</span>
            <span className="text-[11px] font-normal text-zinc-500">
              {t("optional")}
            </span>
          </div>
          <textarea
            name="message"
            aria-label={t("experience")}
            rows={3}
            placeholder={t("experienceHint")}
            maxLength={1200}
            className={`${inputStyles} min-h-[112px] resize-y`}
          />
        </label>
      </div>

      <label className="my-4 flex items-center gap-3 cursor-pointer text-xs text-zinc-400 select-none leading-normal">
        <input
          type="checkbox"
          name="consent"
          aria-invalid={Boolean(fieldErrors.consent)}
          aria-describedby={fieldErrors.consent ? `${formId}-consent-error` : undefined}
          aria-label={t("recruitmentConsent")}
          required
          className="form-checkbox"
        />
        <span>
          {t("recruitmentConsent")}{" "}
          <Link
            href="/legal/privacy"
            className="text-zinc-200 underline hover:text-[#FF9F3C] transition-colors"
          >
            {t("privacyPolicy")}
          </Link>
          .
        </span>
      </label>
      {fieldError("consent")}

      <div className="pt-2">
        <button
          type="submit"
          className="recruitment-submit"
        >
          <span>{t("submitApplication")}</span>
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {error && (
        <div
          className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed"
          role="alert"
        >
          {error}
        </div>
      )}
    </form>
  );
}
