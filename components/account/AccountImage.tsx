"use client";

import { useState } from "react";
import Image from "next/image";

/** Advance through independent image hosts without retrying a broken URL forever. */
export function AccountImage({ sources, alt = "", width, height, fill = false, className, sizes, fallbackLabel = "" }: {
  sources: string[]; alt?: string; width?: number; height?: number; fill?: boolean;
  className?: string; sizes?: string; fallbackLabel?: string;
}) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = sources[sourceIndex];
  if (!src) return <span className={`account-image-empty ${fill ? "account-image-empty-fill" : ""} ${className ?? ""}`} style={fill ? undefined : { width, height }} aria-hidden={alt ? undefined : true} aria-label={alt || undefined} role={alt ? "img" : undefined}>
    {fallbackLabel.split(/\s|&/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("") || "◇"}
  </span>;
  return <Image key={src} src={src} alt={alt} width={fill ? undefined : width} height={fill ? undefined : height} fill={fill} sizes={sizes} className={className} unoptimized
    onError={() => setSourceIndex((current) => current === sourceIndex ? current + 1 : current)} />;
}
