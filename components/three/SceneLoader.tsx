"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useState } from "react";
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });
function SceneFallback() {
  return <div className="scene-fallback" aria-hidden="true"><div className="fallback-crystal" /></div>;
}
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
      <SceneFallback />
    ) : (
      this.props.children
    );
  }
}
export function SceneLoader() {
  const [softwareRenderer, setSoftwareRenderer] = useState(false);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", { powerPreference: "low-power" });
    if (!gl) {
      const frame = requestAnimationFrame(() => setSoftwareRenderer(true));
      return () => cancelAnimationFrame(frame);
    }
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|microsoft basic render driver/i.test(renderer);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    if (software) {
      const frame = requestAnimationFrame(() => setSoftwareRenderer(true));
      return () => cancelAnimationFrame(frame);
    }
  }, []);
  if (softwareRenderer) return <SceneFallback />;
  return (
    <SceneBoundary>
      <SceneCanvas />
    </SceneBoundary>
  );
}
