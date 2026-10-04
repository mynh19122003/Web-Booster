"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
export function Experience({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [entryPath] = useState(path);
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
          gsap.from(el, {
            y: 24,
            opacity: 0,
            duration: 0.7,
            scrollTrigger: { trigger: el, start: "top 94%", once: true },
          }),
        );
        if (document.querySelector(".step-line"))
          gsap.to(".step-line", {
            scaleX: 1,
            scrollTrigger: {
              trigger: ".steps",
              start: "top 85%",
              end: "bottom 60%",
              scrub: true,
            },
          });
      }, ref);
      return () => ctx.revert();
    });
    return () => media.revert();
  }, [path]);
  return (
    <div ref={ref}>
      <motion.div
        key={path}
        initial={reduced || path === entryPath ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
