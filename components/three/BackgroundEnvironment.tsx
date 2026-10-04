"use client";
import { Environment } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { useMemo, useEffect } from "react";
import {
  CubeUVReflectionMapping,
  DataTexture,
  FileLoader,
  HalfFloatType,
  LinearFilter,
  RGBAFormat,
} from "three";
import dimensions from "@/data/environment.json";

export function BackgroundEnvironment() {
  const bytes = useLoader(
    FileLoader,
    "/textures/ascend-environment.bin.gz",
    (loader) => loader.setResponseType("arraybuffer"),
  );
  const environment = useMemo(() => {
    const texture = new DataTexture(
      new Uint16Array(bytes as ArrayBuffer),
      dimensions.width,
      dimensions.height,
      RGBAFormat,
      HalfFloatType,
    );
    texture.mapping = CubeUVReflectionMapping;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }, [bytes]);
  useEffect(() => () => environment.dispose(), [environment]);
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 6, 5]} intensity={3} color="#ffdab1" />
      <directionalLight position={[-5, 2, 3]} intensity={2} color="#8a9ba9" />
      <pointLight position={[0, -2, 4]} intensity={15} color="#ff8237" />
      <Environment map={environment} />
    </>
  );
}
