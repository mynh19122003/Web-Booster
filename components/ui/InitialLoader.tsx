"use client";
import { UiText } from "@/components/ui/UiText";

import { useEffect, useState } from "react";
export function InitialLoader() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const complete = () => setLoading(false);
    window.addEventListener("ascend-scene-ready", complete);
    const timeout = setTimeout(complete, 1500);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("ascend-scene-ready", complete);
    };
  }, []);
  return loading ? (
    <div className="scene-loader" role="status">
      <span /><UiText english={"ASCEND / INITIALIZING"} /></div>
  ) : null;
}
