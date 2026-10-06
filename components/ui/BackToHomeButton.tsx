"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackToHomeButtonProps {
  className?: string;
  label?: string;
  href?: string;
}

export function BackToHomeButton({
  className = "",
  label = "Back to home",
  href = "/",
}: BackToHomeButtonProps) {
  return (
    <Link
      href={href}
      className={`group fixed top-6 left-6 z-50 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 hover:border-[#FF9F3C]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(0,0,0,0.6)] transition-all duration-200 select-none ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-[#FF9F3C] transition-all duration-200 group-hover:-translate-x-0.5 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
