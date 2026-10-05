"use client";
import { useState } from "react";
import { faqs } from "@/data/faqs";
import {
  Plus,
  Minus,
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
    <section className="section" id="faq">
      <div className="container faq-layout">
        <div className="faq-aside" data-reveal>
          <p className="eyebrow">A LITTLE MORE CLARITY</p>
          <h2>
            Good questions.
            <br />
            <span className="muted">Straight answers.</span>
          </h2>
          <div className="faq-topic-nav">
            <span><Compass size={14} /> JUMP TO A TOPIC</span>
            <div>
              {[
                ["Account safety", 1],
                ["Delivery", 3],
                ["Tracking", 5],
              ].map(([label, index]) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={open === index}
                  onClick={() => jumpToQuestion(Number(index))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="faq-support-card">
            <span className="faq-support-icon"><Headphones size={19} /></span>
            <div>
              <small>NEED A HAND?</small>
              <strong>We’re here to help.</strong>
              <p>Browse support or get in touch.</p>
            </div>
            <Link href="/support" aria-label="Visit the help center">
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <p className="faq-preview-note">
            <ShieldCheck size={15} /> This is a demo. Plans and payment methods are illustrative.
          </p>
        </div>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <div className="faq-item" key={f.q}>
              <h3>
                <button
                  aria-expanded={open === i}
                  aria-controls={`faq-${i}`}
                  id={`question-${i}`}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  {f.q}
                  {open === i ? <Minus size={17} /> : <Plus size={17} />}
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    id={`faq-${i}`}
                    role="region"
                    aria-labelledby={`question-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.22 }}
                  >
                    <p>{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
