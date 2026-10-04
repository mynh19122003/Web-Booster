"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
export function TrophyScene({
  fragment,
  reduced,
}: {
  fragment: React.RefObject<number>;
  reduced: boolean;
}) {
  const path = usePathname();
  useEffect(() => {
    const el = document.getElementById("trophy");
    if (!el || reduced) return;
    gsap.registerPlugin(ScrollTrigger);
    const state = { value: 1 };
    const tween = gsap.to(state, {
      value: 0,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        end: "center 45%",
        scrub: true,
      },
      onUpdate: () => {
        fragment.current = state.value;
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [path, fragment, reduced]);
  return null;
}
