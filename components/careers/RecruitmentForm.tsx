"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, RotateCcw } from "lucide-react";
import { games } from "@/data/games";
import { ranksFor } from "@/lib/service-options";
import { addApplication } from "@/lib/local-records";
import Link from "next/link";

const inputStyles =
  "w-full min-h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-500 transition-all duration-200 hover:border-white/20 focus:border-[#FF9F3C] focus:ring-1 focus:ring-[#FF9F3C]/50 focus:outline-none";

const labelStyles = "flex flex-col gap-2 text-xs font-semibold text-zinc-300";

export function RecruitmentForm() {
  const [game, setGame] = useState(games[0].slug);
  const [savedId, setSavedId] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
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
      setError(
        "Check your name, email and rank, confirm consent, and use a valid phone number if provided.",
      );
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
      setError(
        "Your application could not be saved. Check browser storage and try again.",
      );
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
          Application received
        </h3>
        <p className="text-sm text-zinc-300 max-w-md mb-6 leading-relaxed">
          Application Reference:{" "}
          <span className="font-mono text-[#FF9F3C] font-semibold">
            {savedId}
          </span>
          . Our recruitment team reviews elite profiles within 24–48 hours.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF9F3C] hover:text-[#f8b15d] transition-colors py-2 px-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer"
          onClick={() => setSavedId("")}
        >
          <RotateCcw size={14} /> Submit another application
        </button>
      </div>
    );

  return (
    <form className="space-y-6" onSubmit={submit}>
      <div>
        <h3 className="text-xl sm:text-2xl font-heading font-bold uppercase tracking-wider text-white mb-1.5">
          Apply to join
        </h3>
        <p className="text-xs text-zinc-400">
          Required fields are marked with an asterisk (*).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <label className={labelStyles}>
          <span>Full name *</span>
          <input
            name="name"
            aria-label="Full name"
            autoComplete="name"
            placeholder="Your full name"
            required
            minLength={2}
            maxLength={80}
            className={inputStyles}
          />
        </label>

        <label className={labelStyles}>
          <span>Email *</span>
          <input
            name="email"
            aria-label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength={120}
            className={inputStyles}
          />
        </label>

        <label className={labelStyles}>
          <span>Game *</span>
          <select
            name="game"
            aria-label="Game"
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
          <span>Current rank *</span>
          <select
            name="rank"
            aria-label="Current rank"
            key={game}
            required
            defaultValue=""
            className={`${inputStyles} cursor-pointer [&>option]:bg-[#121316]/95 backdrop-blur-2xl [&>option]:text-white`}
          >
            <option value="" disabled className="text-zinc-600">
              Select your rank
            </option>
            {ranksFor(game).map((rank) => (
              <option key={rank} value={rank}>
                {rank}
              </option>
            ))}
          </select>
        </label>

        <label className={labelStyles}>
          <div className="flex items-center justify-between">
            <span>Availability</span>
            <span className="text-[11px] font-normal text-zinc-500">
              Optional
            </span>
          </div>
          <input
            name="availability"
            aria-label="Availability"
            placeholder="e.g. Weekday evenings, UTC+7"
            maxLength={160}
            className={inputStyles}
          />
        </label>

        <label className={labelStyles}>
          <div className="flex items-center justify-between">
            <span>Phone number</span>
            <span className="text-[11px] font-normal text-zinc-500">
              Optional
            </span>
          </div>
          <input
            name="phone"
            aria-label="Phone number"
            type="tel"
            autoComplete="tel"
            placeholder="+84 ..."
            pattern="[+0-9\s().\-]{7,25}"
            minLength={7}
            maxLength={25}
            className={inputStyles}
          />
        </label>

        <label className={`${labelStyles} sm:col-span-2`}>
          <div className="flex items-center justify-between">
            <span>Player profile</span>
            <span className="text-[11px] font-normal text-zinc-500">
              Optional
            </span>
          </div>
          <input
            name="profile"
            aria-label="Player profile"
            type="url"
            placeholder="https://tracker.gg/... or op.gg/..."
            maxLength={500}
            className={inputStyles}
          />
        </label>

        <label className={`${labelStyles} sm:col-span-2`}>
          <div className="flex items-center justify-between">
            <span>Experience</span>
            <span className="text-[11px] font-normal text-zinc-500">
              Optional
            </span>
          </div>
          <textarea
            name="message"
            aria-label="Experience"
            rows={3}
            placeholder="Tell us about your competitive background, rank achievements, or coaching history"
            maxLength={1200}
            className={`${inputStyles} min-h-[112px] resize-y`}
          />
        </label>
      </div>

      <label className="my-4 flex items-center gap-3 cursor-pointer text-xs text-zinc-400 select-none leading-normal">
        <input
          type="checkbox"
          name="consent"
          aria-label="I agree to save my details for application review"
          required
          className="w-4 h-4 min-w-[16px] min-h-[16px] flex-shrink-0 cursor-pointer appearance-none rounded border border-white/20 bg-black/40 checked:border-[#FF9F3C] checked:bg-[#FF9F3C] checked:bg-[url('data:image/svg+xml,%3Csvg_viewBox=%270_0_16_16%27_fill=%27none%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath_d=%27m3_8_3_3_7-7%27_stroke=%27%23000%27_stroke-width=%272%27_stroke-linecap=%27round%27_stroke-linejoin=%27round%27/%3E%3C/svg%3E')] transition-all focus:ring-1 focus:ring-[#FF9F3C]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF9F3C]"
        />
        <span>
          I agree to save my details for application review. * Read our{" "}
          <Link
            href="/legal/privacy"
            className="text-zinc-200 underline hover:text-[#FF9F3C] transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <div className="pt-2">
        <button
          type="submit"
          className="h-[52px] px-8 rounded-xl flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-[#FF9F3C] via-[#F59E0B] to-[#D97706] text-black font-heading font-extrabold uppercase tracking-wider shadow-[0_0_25px_rgba(255,159,60,0.35)] hover:shadow-[0_0_35px_rgba(255,159,60,0.5)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <span>Submit application</span>
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
