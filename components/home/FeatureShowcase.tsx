"use client";

import { useState } from "react";
import {
  Headphones,
  EyeOff,
  Activity,
  Gift,
  Send,
  Check,
} from "lucide-react";

export function FeatureShowcase() {
  const [offline, setOffline] = useState(true);
  const [reward, setReward] = useState(0);
  const [chat, setChat] = useState(false);
  const [progress, setProgress] = useState(68);

  return (
    <section className="section relative isolate overflow-hidden">
      {/* Ambient background lighting */}
      <div
        className="bg-[#D97706]/15 blur-[160px] w-[600px] h-[300px] pointer-events-none rounded-full absolute -top-10 left-1/3 -z-10"
        aria-hidden="true"
      />

      <div className="container relative z-10">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow text-[#FF9F3C]">WHY PLAYERS CHOOSE ASCEND</p>
            <h2>
              More than <span className="muted">a service.</span>
            </h2>
          </div>
          <p>
            Enterprise security, verified elite players,
            <br />
            and dedicated support on every order.
          </p>
        </div>

        <div className="feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* 1. 24/7 LIVE SUPPORT */}
          <article className="feature-card group relative flex flex-col justify-between h-full p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1.5 hover:border-[#FF9F3C]/50 hover:shadow-[0_0_30px_rgba(255,159,60,0.15)] transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#FF9F3C] mb-4 group-hover:scale-105 group-hover:border-[#FF9F3C]/30 transition-all">
                <Headphones size={20} />
              </div>
              <h3 className="text-base font-heading font-bold uppercase tracking-wider text-white mb-4">
                24/7 Live Support
              </h3>
              <div className="space-y-2.5 mb-5 min-h-[110px] flex flex-col justify-center">
                <div className="self-start max-w-[90%] rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/5 p-3 text-xs text-zinc-300 leading-relaxed">
                  Hey! Ready for your next level?
                </div>
                {chat && (
                  <div className="self-end max-w-[90%] ml-auto rounded-xl rounded-tr-sm bg-[#FF9F3C]/10 border border-[#FF9F3C]/20 p-3 text-xs text-[#F5D7A1] leading-relaxed animate-fadeIn">
                    Absolutely. Let’s make a plan.
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setChat(!chat)}
                className="w-full flex items-center justify-between bg-black/40 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 hover:text-white transition-all group/btn cursor-pointer"
              >
                <span>{chat ? "Reset chat" : "Test live chat"}</span>
                <Send
                  size={13}
                  className="text-zinc-500 group-hover/btn:text-[#FF9F3C] transition-colors"
                />
              </button>
            </div>
          </article>

          {/* 2. OFFLINE & VPN PRIVACY */}
          <article className="feature-card group relative flex flex-col justify-between h-full p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1.5 hover:border-[#FF9F3C]/50 hover:shadow-[0_0_30px_rgba(255,159,60,0.15)] transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#FF9F3C] mb-4 group-hover:scale-105 group-hover:border-[#FF9F3C]/30 transition-all">
                <EyeOff size={20} />
              </div>
              <h3 className="text-base font-heading font-bold uppercase tracking-wider text-white mb-4">
                Offline & VPN Privacy
              </h3>
              <div className="min-h-[110px] flex flex-col justify-center gap-3 mb-5">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        offline
                          ? "bg-[#FF9F3C] shadow-[0_0_8px_rgba(255,159,60,0.7)]"
                          : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                      }`}
                    />
                    <strong className="text-xs font-semibold text-white">
                      {offline ? "Invisible mode" : "Visible mode"}
                    </strong>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={offline}
                    aria-label="Invisible mode toggle"
                    onClick={() => setOffline(!offline)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      offline ? "bg-[#FF9F3C]" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        offline ? "translate-x-5 !bg-black/40" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Boosters play in offline presence mode so your friend list sees no activity.
                </p>
              </div>
            </div>
          </article>

          {/* 3. LIVE MATCH TRACKING */}
          <article className="feature-card group relative flex flex-col justify-between h-full p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1.5 hover:border-[#FF9F3C]/50 hover:shadow-[0_0_30px_rgba(255,159,60,0.15)] transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#FF9F3C] mb-4 group-hover:scale-105 group-hover:border-[#FF9F3C]/30 transition-all">
                <Activity size={20} />
              </div>
              <h3 className="text-base font-heading font-bold uppercase tracking-wider text-white mb-4">
                Live Match Tracking
              </h3>
              <div className="min-h-[110px] flex flex-col justify-center mb-5">
                <button
                  type="button"
                  className="w-full text-left p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all flex flex-col gap-3 group/prog cursor-pointer"
                  onClick={() =>
                    setProgress(progress === 100 ? 68 : Math.min(100, progress + 8))
                  }
                >
                  <div className="flex items-center justify-between w-full">
                    <strong className="text-3xl font-heading font-extrabold text-white tracking-tight tabular-nums">
                      {progress}%
                    </strong>
                    <span className="text-[#FF9F3C] group-hover/prog:scale-110 transition-transform">
                      {progress === 100 ? (
                        <Check size={20} className="text-emerald-400" />
                      ) : (
                        <Activity size={20} className="text-[#FF9F3C]" />
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF9F3C] to-[#D97706] transition-all duration-500 shadow-[0_0_10px_rgba(255,159,60,0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <small className="text-[11px] text-zinc-400 group-hover/prog:text-zinc-200 transition-colors">
                    {progress === 100
                      ? "Order complete · Reset"
                      : "Simulate live game progress →"}
                  </small>
                </button>
              </div>
            </div>
          </article>

          {/* 4. CASHBACK & REWARDS */}
          <article className="feature-card group relative flex flex-col justify-between h-full p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1.5 hover:border-[#FF9F3C]/50 hover:shadow-[0_0_30px_rgba(255,159,60,0.15)] transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#FF9F3C] mb-4 group-hover:scale-105 group-hover:border-[#FF9F3C]/30 transition-all">
                <Gift size={20} />
              </div>
              <h3 className="text-base font-heading font-bold uppercase tracking-wider text-white mb-4">
                Cashback & Rewards
              </h3>
              <div className="min-h-[110px] flex flex-col justify-center mb-5">
                <button
                  type="button"
                  className="w-full text-left p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all flex items-center gap-4 group/rew cursor-pointer"
                  onClick={() => setReward((reward + 1) % 3)}
                >
                  <div className="flex items-baseline text-4xl font-heading font-extrabold text-[#F5D7A1] drop-shadow-[0_0_12px_rgba(255,159,60,0.25)] tracking-tight tabular-nums">
                    <span>{[3, 7, 10][reward]}</span>
                    <span className="text-xl font-heading font-bold text-[#FF9F3C] ml-0.5">%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-heading font-bold tracking-wider uppercase bg-[#FF9F3C]/10 text-[#FF9F3C] border border-[#FF9F3C]/30 mb-1">
                      {["BRONZE", "GOLD", "ELITE"][reward]} CASHBACK
                    </span>
                    <small className="block text-[11px] text-zinc-400 group-hover/rew:text-zinc-200 transition-colors">
                      Tap to switch tier →
                    </small>
                  </div>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
