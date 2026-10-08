"use client";
import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { RankCrystal } from "./RankCrystal";
import { FloatingParticles } from "./FloatingParticles";
import { GamePortal } from "./GamePortal";
import { TrophyScene } from "./TrophyScene";
import { useStore } from "@/store/useStore";
export function HeroScene({
  mobile,
  reduced,
}: {
  mobile: boolean;
  reduced: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const artifact = useRef<THREE.Group>(null);
  const fragment = useRef(0);
  const assembly = useRef(1);
  const pointer = useRef({ x: 0, y: 0 });
  const { viewport, size, invalidate } = useThree();
  const target = useStore((s) => s.target);
  const game = useStore((s) => s.game);
  const path = usePathname();
  const sections = useRef<(HTMLElement | null)[]>([]);
  const bounds = useRef<{ top: number; height: number }[]>([]);
  const anchorBounds = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const scrollY = useRef(0);
  useEffect(() => {
    sections.current = ["hero", "trophy", "final-cta"].map((id) =>
      document.getElementById(id),
    );
    const measure = () => {
      scrollY.current = window.scrollY;
      bounds.current = sections.current.map((el) => {
        if (!el) return { top: Infinity, height: 0 };
        const rect = el.getBoundingClientRect();
        return { top: rect.top + window.scrollY, height: rect.height };
      });
      const anchor = document.getElementById("hero-artifact-anchor");
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        anchorBounds.current = {
          left: rect.left,
          top: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        };
      } else {
        anchorBounds.current = null;
      }
      invalidate();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    sections.current.forEach((el) => el && observer.observe(el));
    const anchor = document.getElementById("hero-artifact-anchor");
    if (anchor) observer.observe(anchor);
    measure();
    const move = (e: PointerEvent) => {
      pointer.current = {
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      };
    };
    if (!mobile && !reduced)
      window.addEventListener("pointermove", move, { passive: true });
    let scrollFrame = 0;
    const onScroll = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        scrollY.current = window.scrollY;
        invalidate();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    invalidate();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", onScroll);
    };
  }, [path, mobile, reduced, invalidate]);
  useFrame(({ clock }) => {
    if (!root.current || !artifact.current) return;
    const scroll = scrollY.current;
    const index = bounds.current.findIndex(
      (r) => r.top - scroll < size.height && r.top + r.height - scroll > 0,
    );
    if (index < 0) {
      root.current.visible = false;
      return;
    }
    root.current.visible = true;
    const rect = {
      top: bounds.current[index].top - scroll,
      height: bounds.current[index].height,
    };
    const anchor = index === 0 ? anchorBounds.current : undefined;
    const px = anchor ? anchor.left + anchor.width / 2 : mobile ? size.width * 0.55 : size.width * 0.745;
    const offset =
      index === 0
        ? mobile
          ? 665
          : Math.min(rect.height * 0.44, 480)
        : index === 1
          ? mobile
            ? 455
            : rect.height * 0.5
          : mobile
            ? 460
            : rect.height * 0.5;
    const py = anchor ? anchor.top - scroll + anchor.height / 2 : rect.top + offset;
    root.current.position.set(
      (px / size.width - 0.5) * viewport.width,
      (0.5 - py / size.height) * viewport.height,
      0,
    );
    const scale =
      (((anchor ? Math.min(anchor.width * 1.05, 680) : mobile
        ? Math.min(size.width * 0.85, 380)
        : Math.min(size.width * 0.48, 680)) /
        size.width) *
        viewport.width) /
      4.2;
    root.current.scale.setScalar(scale);
    fragment.current = index === 1 ? assembly.current : 0;
    const time = clock.elapsedTime;
    artifact.current.rotation.y = reduced
      ? -0.22
      : Math.sin(time * 0.21) * 0.22 - 0.25 + pointer.current.x * 0.24;
    artifact.current.rotation.x = reduced
      ? 0.05
      : Math.sin(time * 0.17) * 0.04 + pointer.current.y * 0.1;
    artifact.current.position.y = reduced ? 0 : Math.sin(time * 0.75) * 0.065;
    if (index === 0 && !reduced) {
      root.current.position.z =
        -Math.min(Math.max(-rect.top / size.height, 0), 1) * 0.5;
    }
  });
  const accent =
    game === "valorant"
      ? "#e8876e"
      : target === 7
        ? "#b994da"
        : target === 6
          ? "#e2ac66"
          : "#ffc06b";
  return (
    <>
      <TrophyScene fragment={assembly} reduced={reduced} />
      <group ref={root}>
        <GamePortal />
        <FloatingParticles mobile={mobile} />
        <group ref={artifact}>
          <RankCrystal fragment={fragment} accent={accent} />
        </group>
        <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.4, 32]} />
          <meshBasicMaterial
            color="#ad753a"
            transparent
            opacity={0.035}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  );
}
