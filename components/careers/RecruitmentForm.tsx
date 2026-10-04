"use client";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, RotateCcw } from "lucide-react";
import { games } from "@/data/games";
import { ranksFor } from "@/lib/service-options";
import { addApplication } from "@/lib/local-records";

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
      !/^[+\d\s().-]{7,25}$/.test(phone) ||
      phone.replace(/\D/g, "").length < 7 ||
      !ranksFor(game).includes(rank) ||
      values.get("consent") !== "on"
    ) {
      setError(
        "Please enter a valid name, email, phone number and rank, and confirm your consent.",
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
        message: String(values.get("message") || "").trim(),
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
      <div className="form-grid">
        <label>
          Full name
          <input
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            required
            minLength={2}
            maxLength={80}
          />
        </label>
        <label>
          Email
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
          Phone number
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+84 ..."
            required
            minLength={7}
            maxLength={25}
          />
        </label>
        <label>
          Game
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
          Current rank
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
      </div>
      <label>
        Experience <span className="field-optional">optional</span>
        <textarea
          name="message"
          rows={3}
          placeholder="Coaching experience, availability, or a profile link"
          maxLength={1200}
        />
      </label>
      <label className="consent-label">
        <input type="checkbox" name="consent" required />
        <span>
          I agree to have my contact details saved for application review.
        </span>
      </label>
      <div className="form-submit">
        <button className="button" type="submit">
          Save application <ArrowUpRight size={17} />
        </button>
        <span className="local-notice">
          Local preview · saved on this browser
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
