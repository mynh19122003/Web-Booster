"use client";
import { useEffect, useRef } from "react";
export function PointerEffects() {
  const ref = useRef<HTMLDivElement>(null);
  const reflection = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      !matchMedia("(pointer:fine) and (prefers-reduced-motion:no-preference)")
        .matches
    )
      return;
    let active: HTMLElement | null = null;
    const surfaceSelector = [
      ".game-card",
      ".catalog-item",
      ".feature-card",
      ".review-card",
      ".button",
      ".icon-button",
      ".desktop-nav a",
      ".desktop-nav button",
      ".nav-shell",
      ".service-picker button",
      ".rank-grid button",
      ".catalog-tabs button",
      ".faq-topic-nav button",
      ".faq-item button",
      ".header",
      ".dashboard",
      ".player-card",
      ".config-panel",
      ".auth-content",
      ".auth-aside",
      ".footer a",
    ].join(",");
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerTarget: EventTarget | null = null;
    const paint = () => {
      frame = 0;
      const x = pointerX;
      const y = pointerY;
      const header = document.querySelector<HTMLElement>(".header");
      if (header) {
        const headerRect = header.getBoundingClientRect();
        header.style.setProperty("--shine-x", `${x - headerRect.left}px`);
        header.style.setProperty("--shine-y", `${y - headerRect.top}px`);
      }
      if (reflection.current) {
        reflection.current.style.setProperty("--pointer-x", `${x}px`);
        reflection.current.style.setProperty("--pointer-y", `${y}px`);
        reflection.current.style.opacity = "1";
      }
      if (ref.current) {
        ref.current.style.transform = `translate(${x - 100}px,${y - 100}px)`;
        ref.current.style.opacity = ".6";
      }
      const target = pointerTarget;
      const el =
        target instanceof Element
          ? target.closest<HTMLElement>(".magnetic,.game-card")
          : null;
      const surface =
        target instanceof Element
          ? target.closest<HTMLElement>(surfaceSelector)
          : null;
      if (activeSurface && activeSurface !== surface) {
        activeSurface.style.removeProperty("--shine-x");
        activeSurface.style.removeProperty("--shine-y");
        activeSurface = null;
      }
      if (surface) {
        const rect = surface.getBoundingClientRect();
        surface.style.setProperty("--shine-x", `${x - rect.left}px`);
        surface.style.setProperty("--shine-y", `${y - rect.top}px`);
        activeSurface = surface;
      }
      if (active && active !== el) {
        active.style.transform = "";
        active = null;
      }
      if (el) {
        const rect = el.getBoundingClientRect();
        const localX = (x - rect.left) / rect.width - 0.5;
        const localY = (y - rect.top) / rect.height - 0.5;
        el.style.transform = el.classList.contains("magnetic")
          ? `translate(${localX * 7}px,${localY * 5}px)`
          : `perspective(900px) rotateX(${-localY * 3}deg) rotateY(${localX * 3}deg) translateY(-5px)`;
        active = el;
      }
    };
    const move = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerTarget = event.target;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    let activeSurface: HTMLElement | null = null;
    const leave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (ref.current) ref.current.style.opacity = "0";
      if (reflection.current) reflection.current.style.opacity = "0";
      if (active) active.style.transform = "";
      active = null;
      if (activeSurface) {
        activeSurface.style.removeProperty("--shine-x");
        activeSurface.style.removeProperty("--shine-y");
      }
      activeSurface = null;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <>
      <div ref={ref} className="cursor-glow" aria-hidden="true" />
      <div
        ref={reflection}
        className="cursor-reflection"
        aria-hidden="true"
      />
    </>
  );
}
