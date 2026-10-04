"use client";
import { useState } from "react";
import { Headphones, EyeOff, Activity, Gift, Send, Check } from "lucide-react";
export function FeatureShowcase() {
  const [offline, setOffline] = useState(true);
  const [reward, setReward] = useState(0);
  const [chat, setChat] = useState(false);
  const [progress, setProgress] = useState(68);
  return (
    <section className="section">
      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">THE DETAILS MAKE THE DIFFERENCE</p>
            <h2>
              More than <span className="muted">a service.</span>
            </h2>
          </div>
          <p>
            A thoughtful experience.
            <br />
            From the first click to the final victory.
          </p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <Headphones />
            <h3>Always in your corner.</h3>
            <p>A little guidance goes a long way.</p>
            <div className="mini-chat">
              <span>Hey! Ready for your next level?</span>
              {chat && (
                <span className="chat-response">
                  Absolutely. Let’s make a plan.
                </span>
              )}
              <button onClick={() => setChat(!chat)}>
                {chat ? "Reset preview" : "Try a conversation"}{" "}
                <Send size={13} />
              </button>
            </div>
            <small>01 / SUPPORT PREVIEW</small>
          </article>
          <article className="feature-card">
            <EyeOff />
            <h3>Your climb. Your space.</h3>
            <p>Privacy controls, front and center.</p>
            <div className="privacy-demo">
              <span className={`presence-orb ${offline ? "offline" : ""}`} />
              <strong>{offline ? "Invisible mode" : "Visible mode"}</strong>
              <button
                role="switch"
                aria-checked={offline}
                aria-label="Invisible mode demo"
                className="switch"
                onClick={() => setOffline(!offline)}
              >
                <span />
              </button>
            </div>
            <small>02 / PRIVACY CONTROLS</small>
          </article>
          <article className="feature-card">
            <Activity />
            <h3>Every step, connected.</h3>
            <p>Follow your momentum in real time.</p>
            <button
              className="progress-demo"
              onClick={() =>
                setProgress(progress === 100 ? 68 : Math.min(100, progress + 8))
              }
            >
              <strong>
                {progress}%{" "}
                <span>
                  {progress === 100 ? (
                    <Check size={20} />
                  ) : (
                    <Activity size={20} />
                  )}
                </span>
              </strong>
              <div className="progress-track">
                <div style={{ width: `${progress}%` }} />
              </div>
              <small>
                {progress === 100
                  ? "Milestone reached · Reset"
                  : "Simulate next match →"}
              </small>
            </button>
            <small>03 / LIVE PROGRESS</small>
          </article>
          <article className="feature-card">
            <Gift />
            <h3>Loyalty levels up.</h3>
            <p>A little extra for the journey ahead.</p>
            <button
              className="rewards-demo"
              onClick={() => setReward((reward + 1) % 3)}
            >
              <strong>
                {[3, 7, 10][reward]}
                <span>%</span>
              </strong>
              <span>
                {["BRONZE", "GOLD", "ELITE"][reward]} REWARDS
                <br />
                <small>Explore next tier →</small>
              </span>
            </button>
            <small>04 / REWARDS CONCEPT</small>
          </article>
        </div>
      </div>
    </section>
  );
}
