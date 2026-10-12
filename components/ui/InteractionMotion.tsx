"use client";

import { motion, useReducedMotion } from "motion/react";

/** Shared feedback for interactive cards and rows. Keep layout IDs scoped per control. */
export function useInteractionMotion() {
  const reduced = useReducedMotion();
  return {
    card: {
      whileHover: reduced ? undefined : { y: -4, scale: 1.015 },
      whileFocus: reduced ? undefined : { y: -4, scale: 1.015 },
      whileTap: reduced ? undefined : { scale: 0.98 },
      transition: { duration: reduced ? 0 : 0.2, ease: "easeOut" as const },
    },
    entry: (index: number) => ({
      initial: reduced ? false as const : { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: reduced ? 0 : 0.2, delay: reduced ? 0 : Math.min(index, 10) * 0.05 },
    }),
  };
}

export function ActiveIndicator({ id }: { id: string }) {
  const reduced = useReducedMotion();
  return <motion.span aria-hidden="true" className="active-choice-indicator" layoutId={id}
    transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }} />;
}
