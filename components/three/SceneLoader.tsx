"use client";
import dynamic from "next/dynamic";
import { Component } from "react";
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
  return (
    <SceneBoundary>
      <SceneCanvas />
    </SceneBoundary>
  );
}
