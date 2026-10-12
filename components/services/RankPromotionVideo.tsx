"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function RankPromotionVideo({ src, poster, sequence, onComplete, children }: {
  src: string;
  poster?: string;
  sequence: number;
  onComplete: (sequence: number) => void;
  children: ReactNode;
}) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"loading" | "playing" | "ending">("loading");

  useEffect(() => {
    let active = true;
    const player = playerRef.current;
    if (!player) return;
    let frameId: number | undefined;
    let revealed = false;
    let ending = false;
    const complete = () => { if (active) onComplete(sequence); };

    const finish = () => {
      if (!active || ending) return;
      ending = true;
      // Freeze the decoded tail before fading. A stopped/ended video surface
      // must never replace the crest with a transparent or black frame.
      player.pause();
      setPhase("ending");
    };
    const updateFrame = (mediaTime: number) => {
      if (!active || ending) return;
      if (!revealed) {
        revealed = true;
        setPhase("playing");
      }
      if (Number.isFinite(player.duration) && player.duration - mediaTime <= 0.45) finish();
    };
    const onFrame: VideoFrameRequestCallback = (_, metadata) => {
      frameId = undefined;
      updateFrame(metadata.mediaTime);
      if (active && !ending) frameId = player.requestVideoFrameCallback(onFrame);
    };
    const supportsFrameCallback = typeof player.requestVideoFrameCallback === "function";
    const reveal = () => {
      if (!active || ending || revealed || frameId !== undefined) return;
      if (supportsFrameCallback) frameId = player.requestVideoFrameCallback(onFrame);
      else updateFrame(player.currentTime);
    };
    const onTimeUpdate = () => {
      if (!supportsFrameCallback && player.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        updateFrame(player.currentTime);
      }
    };
    player.addEventListener("playing", reveal);
    player.addEventListener("timeupdate", onTimeUpdate);
    player.addEventListener("ended", finish);
    player.addEventListener("error", finish);
    const timeout = window.setTimeout(complete, 15000);

    // Decode the ending artwork before playback. The crossfade cannot expose
    // an image which is still loading, even on a cold browser cache.
    const start = async () => {
      if (poster) {
        const artwork = new window.Image();
        artwork.src = poster;
        try { await artwork.decode(); }
        catch { complete(); return; }
      }
      if (!active || ending) return;
      try { await player.play(); }
      catch { if (!ending) complete(); }
    };
    void start();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      player.removeEventListener("playing", reveal);
      player.removeEventListener("timeupdate", onTimeUpdate);
      player.removeEventListener("ended", finish);
      player.removeEventListener("error", finish);
      if (frameId !== undefined) player.cancelVideoFrameCallback(frameId);
      player.pause();
    };
  }, [src, poster, sequence, onComplete]);

  useEffect(() => {
    if (phase !== "ending") return;
    const timeout = window.setTimeout(() => onComplete(sequence), 500);
    return () => window.clearTimeout(timeout);
  }, [phase, sequence, onComplete]);

  return <div className="rank-promotion-playback">
    <div className={`rank-promotion-fallback${phase === "playing" ? " is-hidden" : ""}`}>{children}</div>
    <video
      ref={playerRef}
      className={`rank-promotion-video${phase === "playing" ? " is-playing" : ""}`}
      src={src}
      poster={poster}
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
    />
  </div>;
}
