"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
function Wing({
  side,
  fragment,
}: {
  side: number;
  fragment: React.RefObject<number>;
}) {
  const ref = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.3, -0.8);
    shape.lineTo(1.35, -0.1);
    shape.lineTo(1.67, 1.16);
    shape.lineTo(1.02, 0.75);
    shape.lineTo(0.85, 1.55);
    shape.lineTo(0.49, 0.98);
    shape.lineTo(0.3, -0.8);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.19,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.05,
    });
  }, []);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.x = side * fragment.current * 0.8;
      ref.current.position.y = fragment.current * 0.3;
      ref.current.rotation.z = side * fragment.current * -0.24;
    }
  });
  return (
    <group ref={ref} scale={[side, 1, 1]}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color="#b89a64"
          metalness={0.95}
          roughness={0.24}
        />
      </mesh>
      <mesh position={[0.98, 0.27, 0.23]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.027, 1.12, 0.04]} />
        <meshStandardMaterial
          color="#ffb855"
          emissive="#e87c25"
          emissiveIntensity={2}
          metalness={0.65}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}
export function RankCrystal({
  fragment,
  accent = "#ff9a45",
}: {
  fragment: React.RefObject<number>;
  accent?: string;
}) {
  return (
    <group rotation={[0, 0, -0.12]}>
      <group rotation={[0, 0, Math.PI / 4]}>
        <mesh scale={[0.88, 1.25, 0.5]} castShadow>
          <octahedronGeometry args={[1.28, 0]} />
          <meshStandardMaterial
            color="#514c43"
            metalness={1}
            roughness={0.22}
          />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.42]} scale={[0.48, 0.98, 0.3]} castShadow>
        <octahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial
          color={accent}
          metalness={0.8}
          roughness={0.19}
          clearcoat={1}
          emissive={accent}
          emissiveIntensity={0.12}
        />
      </mesh>
      <mesh position={[0, 0, 0.43]} scale={[0.49, 1, 0.32]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color="#ffc27c"
          wireframe
          transparent
          opacity={0.22}
        />
      </mesh>
      <Wing side={1} fragment={fragment} />
      <Wing side={-1} fragment={fragment} />
      <mesh position={[0, -1.02, 0.23]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.52, 0.52, 0.23]} />
        <meshStandardMaterial color="#c9ad70" metalness={1} roughness={0.22} />
      </mesh>
      <mesh position={[0, 1.33, 0.16]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial
          color="#f7c67f"
          metalness={0.85}
          roughness={0.2}
          emissive="#a05a23"
          emissiveIntensity={0.35}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * 1.85, -0.7, 0]}
          rotation={[0.3, side * 0.5, side * 0.6]}
        >
          <mesh scale={[0.16, 0.5, 0.2]}>
            <octahedronGeometry args={[1]} />
            <meshStandardMaterial
              color="#bc955d"
              metalness={1}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
