"use client";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, RotateCcw } from "lucide-react";
import { games } from "@/data/games";
import { ranksFor } from "@/lib/service-options";
import { addApplication } from "@/lib/local-records";
import Link from "next/link";

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
      (phone !== "" && (!/^[+\d\s().-]{7,25}$/.test(phone) || phone.replace(/\D/g, "").length < 7)) ||
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
        message: [String(values.get("message") || "").trim(), values.get("availability") ? `Availability: ${values.get("availability")}` : "", values.get("profile") ? `Profile: ${values.get("profile")}` : ""].filter(Boolean).join("\n"),
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
      <div className="application-success" role="status">
        <CheckCircle2 size={34} />
        <h3>Application saved</h3>
        <p>
          Reference {savedId}. Your application is available in the admin
          workspace on this browser.
        </p>
        <button
          type="button"
          className="text-link"
          onClick={() => setSavedId("")}
        >
          <RotateCcw size={16} /> New application
        </button>
      </div>
    );
  return (
    <form className="recruitment-form" onSubmit={submit}>
      <div className="recruitment-form-heading"><h3>Apply to join</h3><p>Required fields are marked with an asterisk (*).</p></div>
      <div className="form-grid">
        <label className="application-wide">
          Full name *
          <input
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            required
            minLength={2}
            maxLength={80}
          />
        </label>
        <label className="application-wide">
          Email *
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength={120}
          />
        </label>
        <label>
          Game *
          <select
            name="game"
            aria-label="Game"
            value={game}
            onChange={(e) => setGame(e.target.value)}
          >
            {games.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Current rank *
          <select
            name="rank"
            aria-label="Current rank"
            key={game}
            required
            defaultValue=""
          >
            <option value="" disabled>
              Select your rank
            </option>
            {ranksFor(game).map((rank) => (
              <option key={rank}>{rank}</option>
            ))}
          </select>
        </label>
        <label>Availability <span className="field-optional">Optional</span><input name="availability" placeholder="e.g. Weekday evenings, UTC+7" maxLength={160} /></label>
        <label>Phone number <span className="field-optional">Optional</span><input name="phone" type="tel" autoComplete="tel" placeholder="+84 ..." pattern="[+0-9\s().\-]{7,25}" minLength={7} maxLength={25} /></label>
        <label className="application-wide">Player profile <span className="field-optional">Optional</span><input name="profile" type="url" placeholder="https://" maxLength={500} /></label>
      </div>
      <label>
        <span>Experience <span className="field-optional">Optional</span></span>
        <textarea
          name="message"
          rows={3}
          placeholder="Tell us about your playing or coaching experience"
          maxLength={1200}
        />
      </label>
      <label className="consent-label">
        <input type="checkbox" name="consent" required />
        <span>
          I agree to save my details for application review. * Read our <Link href="/legal/privacy">Privacy Policy</Link>.
        </span>
      </label>
      <div className="form-submit">
        <button className="button" type="submit">
          Save application <ArrowUpRight size={17} />
        </button>
        <span className="local-notice">
          Saved in this browser only. Not sent to a recruitment team.
        </span>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
