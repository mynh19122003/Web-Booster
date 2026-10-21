"use client";
import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RankCrystal } from "./RankCrystal";
import { FloatingParticles } from "./FloatingParticles";
import { GamePortal } from "./GamePortal";
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
  const pointer = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();
  useEffect(() => {
    if (mobile || reduced) return;
    const move = (event: PointerEvent) => {
      pointer.current = {
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5,
      };
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [mobile, reduced]);
  useFrame(({ clock }) => {
    if (!root.current || !artifact.current) return;
    // The browser scrolls the canvas with its anchor; WebGL only animates the model.
    root.current.scale.setScalar(Math.min(viewport.width, viewport.height) / 5.8);
    fragment.current = 0;
    const time = clock.elapsedTime;
    artifact.current.rotation.y = reduced
      ? -0.22
      : Math.sin(time * 0.21) * 0.22 - 0.25 + pointer.current.x * 0.24;
    artifact.current.rotation.x = reduced
      ? 0.05
      : Math.sin(time * 0.17) * 0.04 + pointer.current.y * 0.1;
    artifact.current.position.y = reduced ? 0 : Math.sin(time * 0.75) * 0.065;
  });
  return (
    <>
      <group ref={root}>
        <GamePortal />
        <FloatingParticles mobile={mobile} />
        <group ref={artifact}>
          <RankCrystal fragment={fragment} accent="#e8876e" />
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
