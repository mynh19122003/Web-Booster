"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

export function ShopDisclosure({ children, ...props }: ComponentPropsWithoutRef<"details">) {
  const ref = useRef<HTMLDetailsElement>(null);
  const animation = useRef<Animation | null>(null);
  const expanded = useRef(Boolean(props.open));

  useEffect(() => () => animation.current?.cancel(), []);

  return <details {...props} ref={ref} onClick={(event) => {
    props.onClick?.(event);
    const element = ref.current;
    const target = event.target;
    if (!element || !(target instanceof Element)) return;
    const summary = target.closest("summary");
    if (!summary || summary.parentElement !== element || event.defaultPrevented) return;
    event.preventDefault();
    const startHeight = element.getBoundingClientRect().height;
    animation.current?.cancel();
    expanded.current = !expanded.current;
    const opening = expanded.current;
    element.style.height = "";
    element.style.overflow = "";
    element.open = opening;
    const endHeight = element.getBoundingClientRect().height;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      delete element.dataset.closing;
      return;
    }
    element.open = true;
    element.dataset.closing = String(!opening);
    element.style.overflow = "hidden";
    const active = element.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
    animation.current = active;
    active.onfinish = () => {
      if (animation.current !== active) return;
      element.open = opening;
      element.style.overflow = "";
      delete element.dataset.closing;
      animation.current = null;
    };
  }}>{children}</details>;
}
