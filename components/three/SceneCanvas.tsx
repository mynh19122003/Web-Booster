"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { BackgroundEnvironment } from "./BackgroundEnvironment";
import { RenderScheduler } from "./RenderScheduler";
export default function SceneCanvas() {
  const layer = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const [active, setActive] = useState(true);
  const [heroActive, setHeroActive] = useState(true);
  const [lost, setLost] = useState(false);
  const edge = /Edg\//.test(navigator.userAgent);
  const path = usePathname();
  const enabled = path === "/";
  useEffect(() => {
    const elements = ["hero"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    let frame = 0;
    const clip = () => {
      frame = 0;
      const section = elements.find((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      });
      if (!layer.current) return;
      if (!section || (mobile && section.id !== "hero")) {
        layer.current.style.clipPath = "inset(100%)";
        return;
      }
      const rect = section.getBoundingClientRect();
      const top = Math.max(0, rect.top);
      const bottom = Math.max(0, window.innerHeight - rect.bottom);
      const left = section.id === "hero" ? 0 : window.innerWidth * 0.52;
      layer.current.style.clipPath = `inset(${top}px 0 ${bottom}px ${left}px)`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(clip);
    };
    const observer = new ResizeObserver(schedule);
    elements.forEach((el) => observer.observe(el));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    clip();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [path, mobile]);
  useEffect(() => {
    const mq = window.matchMedia("(max-width:767px)");
    const rm = window.matchMedia("(prefers-reduced-motion:reduce)");
    const update = () => {
      setMobile(mq.matches);
      setReduced(rm.matches);
    };
    update();
    mq.addEventListener("change", update);
    rm.addEventListener("change", update);
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mq.removeEventListener("change", update);
      rm.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    const elements = ["hero"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    const visibility = new Map<Element, boolean>();
    const update = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) =>
        visibility.set(entry.target, entry.isIntersecting),
      );
      setActive(elements.some((el) => visibility.get(el) ?? false));
      const hero = elements.find((el) => el.id === "hero");
      setHeroActive(hero ? (visibility.get(hero) ?? false) : false);
    };
    const observer = new IntersectionObserver(update, { threshold: 0 });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [path]);
  if (lost)
    return (
      <div className="scene-fallback" aria-hidden="true">
        <div className="fallback-crystal" />
      </div>
    );
  return (
    <div
      ref={layer}
      className="scene-layer"
      aria-hidden="true"
      style={{ visibility: enabled && active ? "visible" : "hidden" }}
    >
      <Canvas
        dpr={mobile || edge ? 1 : [1, 1.25]}
        camera={{ position: [0, 0, 10], fov: 40 }}
        gl={{ antialias: !mobile && !edge, alpha: true, powerPreference: "low-power" }}
        frameloop={!visible || !enabled || !active ? "never" : "demand"}
        onCreated={({ gl }) => {
          window.dispatchEvent(new Event("ascend-scene-ready"));
          gl.domElement.addEventListener(
            "webglcontextlost",
            () => setLost(true),
            { once: true },
          );
        }}
      >
        <Suspense fallback={null}>
          <RenderScheduler
            running={visible && enabled && heroActive && !reduced}
            fps={edge ? 15 : mobile ? 20 : 24}
          />
          <BackgroundEnvironment />
          <HeroScene mobile={mobile} reduced={reduced} />
        </Suspense>
      </Canvas>
    </div>
  );
}
