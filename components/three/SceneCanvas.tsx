"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HeroScene } from "./HeroScene";
import { BackgroundEnvironment } from "./BackgroundEnvironment";
import { RenderScheduler } from "./RenderScheduler";
export default function SceneCanvas() {
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(true);
  const [active, setActive] = useState(true);
  const [lost, setLost] = useState(false);
  const path = usePathname();
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
    const elements = ["hero", "trophy", "final-cta"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    const update = () =>
      setActive(
        elements.some((el) => {
          const r = el.getBoundingClientRect();
          return r.top < innerHeight && r.bottom > 0;
        }),
      );
    const observer = new IntersectionObserver(update);
    elements.forEach((el) => observer.observe(el));
    update();
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
      className="scene-layer"
      aria-hidden="true"
      style={{ visibility: active ? "visible" : "hidden" }}
    >
      <Canvas
        dpr={mobile ? 1 : [1, 1.25]}
        camera={{ position: [0, 0, 10], fov: 40 }}
        gl={{ antialias: !mobile, alpha: true, powerPreference: "low-power" }}
        frameloop={!visible || !active ? "never" : "demand"}
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
          <RenderScheduler running={visible && active && !reduced} />
          <BackgroundEnvironment />
          <HeroScene mobile={mobile} reduced={reduced} />
        </Suspense>
      </Canvas>
    </div>
  );
}
