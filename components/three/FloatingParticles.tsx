"use client";
import { useMemo } from "react";
export function FloatingParticles({ mobile }: { mobile: boolean }) {
  const positions = useMemo(() => {
    const count = mobile ? 35 : 100;
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = i * 2.399963;
      const r = 1.5 + (i % 17) / 7;
      values[i * 3] = Math.cos(t) * r;
      values[i * 3 + 1] = Math.sin(t) * r;
      values[i * 3 + 2] = Math.sin(i * 7.12) * 1.4;
    }
    return values;
  }, [mobile]);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#d9a363"
        size={mobile ? 0.012 : 0.018}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
