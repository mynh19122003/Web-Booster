"use client";
import { useEffect, useRef } from "react";
export function PointerEffects() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      !matchMedia("(pointer:fine) and (prefers-reduced-motion:no-preference)")
        .matches
    )
      return;
    let active: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      if (ref.current) {
        ref.current.style.transform = `translate(${e.clientX - 100}px,${e.clientY - 100}px)`;
        ref.current.style.opacity = ".6";
      }
      const el = (e.target as HTMLElement).closest<HTMLElement>(
        ".magnetic,.game-card",
      );
      if (active && active !== el) {
        active.style.transform = "";
        active = null;
      }
      if (el) {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = el.classList.contains("magnetic")
          ? `translate(${x * 7}px,${y * 5}px)`
          : `perspective(900px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg) translateY(-5px)`;
        active = el;
      }
    };
    const leave = () => {
      if (ref.current) ref.current.style.opacity = "0";
      if (active) active.style.transform = "";
      active = null;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);
  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}
