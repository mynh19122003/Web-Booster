"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  flickerSpeed: number;
  flickerOffset: number;
  speedY: number;
  swaySpeed: number;
  swayOffset: number;
  swayAmplitude: number;
  color: string;
}

export function HeroBackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = mediaQuery.matches;

    let animationFrameId: number;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    let isRunning = false;
    let width = (canvas.width = container.offsetWidth);
    let height = (canvas.height = container.offsetHeight);

    const handleResize = () => {
      if (!container || !canvas) return;
      width = canvas.width = container.offsetWidth;
      height = canvas.height = container.offsetHeight;
      initParticles();
    };

    window.addEventListener("resize", handleResize);

    // Track mouse over hero container for smooth spotlight
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    container.addEventListener("pointermove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    const stop = () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    };
    const start = () => {
      if (isRunning || !isVisible || !isPageVisible || isReducedMotion) return;
      isRunning = true;
      animationFrameId = requestAnimationFrame(render);
    };
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) start();
      else stop();
    });
    visibilityObserver.observe(container);
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
      if (isReducedMotion) stop();
      else start();
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    // Particle colors: Prime Gold & Burnt Orange
    const colors = ["#FF9F3C", "#D97706", "#F59E0B"];
    let particles: Particle[] = [];

    const initParticles = () => {
      const count = Math.min(Math.floor(width / 35), 45); // ~35-45 embers responsive
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 1.5 + Math.random() * 2, // 1.5px to 3.5px
          baseAlpha: 0.25 + Math.random() * 0.45,
          alpha: 0.3,
          flickerSpeed: 0.015 + Math.random() * 0.03,
          flickerOffset: Math.random() * Math.PI * 2,
          speedY: 0.3 + Math.random() * 0.5, // 0.3 - 0.8 px/frame
          swaySpeed: 0.01 + Math.random() * 0.02,
          swayOffset: Math.random() * Math.PI * 2,
          swayAmplitude: 0.5 + Math.random() * 1.2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    initParticles();

    let frame = 0;
    function render() {
      const context = ctx;
      if (!context) return;
      frame++;
      context.clearRect(0, 0, width, height);

      // Smooth spotlight interpolation
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      if (mouse.x > -500 && mouse.y > -500 && !isReducedMotion) {
        const spotlight = context.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          320
        );
        spotlight.addColorStop(0, "rgba(255, 159, 60, 0.09)");
        spotlight.addColorStop(0.5, "rgba(217, 119, 6, 0.04)");
        spotlight.addColorStop(1, "rgba(0, 0, 0, 0)");
        context.fillStyle = spotlight;
        context.fillRect(0, 0, width, height);
      }

      // Render Embers
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!isReducedMotion) {
          p.y -= p.speedY;
          p.x += Math.sin(frame * p.swaySpeed + p.swayOffset) * p.swayAmplitude;
          p.alpha =
            p.baseAlpha + Math.sin(frame * p.flickerSpeed + p.flickerOffset) * 0.2;

          // Wrap around top to bottom
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        const clampedAlpha = Math.max(0.1, Math.min(0.75, p.alpha));

        context.save();
        context.shadowColor = p.color;
        context.shadowBlur = p.size * 3;
        context.globalAlpha = clampedAlpha;
        context.fillStyle = p.color;
        context.beginPath();
        context.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      if (isRunning) animationFrameId = requestAnimationFrame(render);
    }

    start();

    return () => {
      cancelAnimationFrame(animationFrameId);
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointermove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. DUAL-LAYER AMBIENT GLOW BLOBS */}
      {/* Primary blob behind 3D artifact (Burnt Orange, slow pulse) */}
      <div
        className="absolute top-1/3 -right-24 sm:right-10 md:right-24 w-[640px] h-[640px] rounded-full bg-[#D97706]/20 blur-[160px] animate-pulse-slow motion-reduce:animate-none"
        style={{ transform: "translate3d(0, 0, 0)" }}
      />

      {/* Secondary blob behind Hero text (Prime Gold, floating gentle loop) */}
      <div
        className="absolute top-16 -left-20 sm:left-4 w-[480px] h-[480px] rounded-full bg-[#FF9F3C]/12 blur-[140px] animate-float-slow motion-reduce:animate-none"
        style={{ transform: "translate3d(0, 0, 0)" }}
      />

      {/* Centered deep ambient warmth layer */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[400px] bg-gradient-to-b from-[#D97706]/15 via-[#FF9F3C]/05 to-transparent rounded-full blur-[150px]" />

      {/* 2. FLOATING EMBER PARTICLES CANVAS */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
