"use client";

import { useState } from "react";
import { faqs } from "@/data/faqs";
import {
  Plus,
  ArrowUpRight,
  Headphones,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import Link from "next/link";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = useReducedMotion();

  function jumpToQuestion(index: number) {
    setOpen(index);
    if (window.matchMedia("(max-width: 1000px)").matches) {
      window.setTimeout(() => {
        document.getElementById(`question-${index}`)?.scrollIntoView({
          behavior: reduced ? "instant" : "smooth",
          block: "center",
        });
      }, 0);
    }
  }

  return (
    <section className="relative isolate overflow-hidden" id="faq">
      {/* Ambient amber backlight */}
      <div
        className="bg-[#D97706]/15 blur-[160px] w-[500px] h-[400px] pointer-events-none rounded-full absolute -top-10 right-1/4 -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* 2. LEFT COLUMN (HERO & NAVIGATION) */}
          <div className="flex h-full flex-col lg:col-span-5" data-reveal>
            <p className="text-[#FF9F3C] text-xs font-heading font-bold tracking-widest uppercase mb-3">
              A LITTLE MORE CLARITY
            </p>
            <h2 className="text-3xl md:text-5xl font-heading font-extrabold uppercase text-white tracking-tight leading-[1.15] mb-8">
              Good questions.
              <br />
              <span className="text-zinc-500 font-light">Straight answers.</span>
            </h2>

            {/* Topic Navigation */}
            <div className="mb-8">
              <span className="flex items-center gap-2 text-[10px] font-heading font-bold tracking-widest text-zinc-500 uppercase mb-3">
                <Compass size={14} className="text-[#FF9F3C]" /> JUMP TO A TOPIC
              </span>
              <div className="flex flex-wrap gap-2.5">
                {[
                  ["Account safety", 1],
                  ["Delivery", 3],
                  ["Tracking", 5],
                ].map(([label, index]) => {
                  const isActive = open === index;
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => jumpToQuestion(Number(index))}
                      className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#FF9F3C]/10 border-[#FF9F3C]/40 text-[#FF9F3C] shadow-[0_0_15px_rgba(255,159,60,0.15)]"
                          : "bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-zinc-300 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* "NEED A HAND?" Card: Compact glass widget */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:border-[#FF9F3C]/40 transition-all flex items-center justify-between mt-8 group">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#FF9F3C]/10 border border-[#FF9F3C]/20 flex items-center justify-center text-[#FF9F3C] shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                  <Headphones size={20} />
                </div>
                <div>
                  <small className="block text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    NEED A HAND?
                  </small>
                  <strong className="block text-sm font-semibold text-white group-hover:text-[#F5D7A1] transition-colors">
                    We’re here to help.
                  </strong>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Browse support or get in touch.
                  </p>
                </div>
              </div>
              <Link
                href="/support"
                aria-label="Visit the help center"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 hover:border-[#FF9F3C]/40 flex items-center justify-center text-zinc-400 group-hover:text-[#FF9F3C] transition-all shrink-0 cursor-pointer"
              >
                <ArrowUpRight
                  size={17}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </Link>
            </div>

            <p className="mt-8 flex items-center gap-2 text-xs leading-relaxed text-zinc-500 lg:mt-auto lg:pt-8">
              <ShieldCheck size={15} className="text-[#FF9F3C] shrink-0" />
              <span>Average response time: &lt; 2 minutes. 24/7 dedicated coverage.</span>
            </p>
          </div>

          {/* 3. RIGHT COLUMN (MIRROR GLASS FAQ CONTAINER) */}
          <div className="h-full lg:col-span-7">
            <div className="h-full bg-gradient-to-b from-white/[0.04] via-white/[0.015] to-transparent backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_20px_50px_rgba(0,0,0,0.6)]">
              <div className="divide-y divide-white/[0.06]">
                {faqs.map((f, i) => {
                  const isOpen = open === i;
                  return (
                    <div
                      key={f.q}
                      className={`transition-all duration-200 ${
                        isOpen ? "bg-white/[0.02] rounded-xl px-4 -mx-4" : "px-2"
                      } py-4`}
                    >
                      <h3>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={`faq-${i}`}
                          id={`question-${i}`}
                          onClick={() => setOpen(isOpen ? null : i)}
                          className="group flex items-center justify-between w-full text-left cursor-pointer gap-4"
                        >
                          <span className="text-base md:text-lg font-semibold text-white group-hover:text-[#FF9F3C] transition-colors leading-snug">
                            {f.q}
                          </span>
                          <div
                            className={`w-8 h-8 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                              isOpen
                                ? "rotate-45 text-[#FF9F3C] bg-[#FF9F3C]/10 border-[#FF9F3C]/20 shadow-[0_0_10px_rgba(255,159,60,0.2)]"
                                : "text-zinc-400 group-hover:text-white group-hover:border-white/20"
                            }`}
                          >
                            <Plus size={16} />
                          </div>
                        </button>
                      </h3>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={`faq-${i}`}
                            role="region"
                            aria-labelledby={`question-${i}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              height: {
                                duration: reduced ? 0 : 0.28,
                                ease: [0.25, 0.1, 0.25, 1],
                              },
                              opacity: { duration: reduced ? 0 : 0.2 },
                            }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 pb-2 text-sm leading-relaxed text-zinc-300 font-normal">
                              <p>{f.a}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
