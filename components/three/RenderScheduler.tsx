"use client";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
export function RenderScheduler({
  running,
  fps = 30,
}: {
  running: boolean;
  fps?: number;
}) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
    if (!running) return;
    // Decorative slow motion does not need a full refresh-rate rendering loop.
    const interval = setInterval(() => invalidate(), 1000 / fps);
    return () => clearInterval(interval);
  }, [running, fps, invalidate]);
  return null;
}
