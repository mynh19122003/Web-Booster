"use client";
export function GamePortal() {
  return (
    <group rotation={[0.22, 0.35, -0.24]}>
      {[2.05, 2.35, 2.65].map((radius, i) => (
        <mesh key={radius} rotation={[i * 0.22, i * 0.14, 0]}>
          <torusGeometry args={[radius, 0.007, 4, 120]} />
          <meshBasicMaterial
            color={i === 0 ? "#c28b51" : "#67513b"}
            transparent
            opacity={i === 0 ? 0.6 : 0.25}
          />
        </mesh>
      ))}
      {Array.from({ length: 24 }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((i / 24) * Math.PI * 2) * 2.65,
            Math.cos((i / 24) * Math.PI * 2) * 2.65,
            0,
          ]}
          rotation={[0, 0, (-i / 24) * Math.PI * 2]}
        >
          <boxGeometry args={[0.008, i % 3 === 0 ? 0.075 : 0.025, 0.008]} />
          <meshBasicMaterial color="#b19573" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}
