"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
export function Experience({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          const siblings = Array.from(el.parentElement?.querySelectorAll(":scope > [data-reveal]") ?? []);
          gsap.from(el, {
            y: 18,
            opacity: 0,
            duration: 0.65,
            delay: Math.min(Math.max(siblings.indexOf(el), 0) * 0.07, 0.21),
            ease: "power2.out",
            clearProps: "transform",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          });
        });
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
  useEffect(() => {
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [language]);
  return (
    <div ref={ref}>
      <div
        key={path}
        className="route-content"
      >
        {children}
      </div>
    </div>
  );
}
