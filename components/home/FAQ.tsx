"use client";
import { useState } from "react";
import { faqs } from "@/data/faqs";
import { Plus, Minus, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import Link from "next/link";
export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = useReducedMotion();
  return (
    <section className="section" id="faq">
      <div className="container faq-layout">
        <div data-reveal>
          <p className="eyebrow">A LITTLE MORE CLARITY</p>
          <h2>
            Good questions.
            <br />
            <span className="muted">Straight answers.</span>
          </h2>
          <p>Still curious about something?</p>
          <Link href="/support" className="text-link">
            Visit the help center <ArrowUpRight size={16} />
          </Link>
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
