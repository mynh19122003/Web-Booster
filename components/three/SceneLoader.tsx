"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });
class SceneBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback" aria-hidden="true">
        <div className="fallback-crystal" />
      </div>
    ) : (
      this.props.children
    );
  }
}
export function SceneLoader() {
  const path = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (path !== "/" || ready) return;
    // Give primary HTML hydration and input handlers priority over decorative WebGL.
    if ("requestIdleCallback" in window) {
      const idle = window.requestIdleCallback(() => setReady(true), {
        timeout: 1000,
      });
      return () => window.cancelIdleCallback(idle);
    }
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [path, ready]);
  return (
    <SceneBoundary>
      {ready ? (
        <SceneCanvas />
      ) : path === "/" ? (
        <div className="scene-fallback" aria-hidden="true">
          <div className="fallback-crystal" />
        </div>
      ) : null}
    </SceneBoundary>
  );
}
