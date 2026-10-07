"use client";

import { useEffect, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { LP_GAIN_OPTIONS } from "@/lib/rank-pricing";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

export function RankGainPicker({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const root = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const selected = LP_GAIN_OPTIONS.find((option) => option.value === value) ?? LP_GAIN_OPTIONS[0];

  function moveFocus(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const options = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
    if (!options.length) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
    options[next].focus();
  }

  useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => {
      if (root.current?.open && !root.current.contains(event.target as Node)) root.current.open = false;
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && root.current?.open) {
        root.current.open = false;
        summary.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return <details ref={root} className="rank-gain-dropdown">
    <summary ref={(node) => { summary.current = node; }} aria-label={label} aria-haspopup="listbox" onKeyDown={(event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const options = root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
      if (!options?.length) return;
      if (root.current) root.current.open = true;
      window.requestAnimationFrame(() => options[event.key === "ArrowDown" ? 0 : options.length - 1]?.focus());
    }}>
      <span>{selected.label}</span><ChevronDown size={16} aria-hidden="true" />
    </summary>
    <div className="rank-gain-options" role="listbox" aria-label={label}>
      {LP_GAIN_OPTIONS.map((option, index) => <button key={option.value} type="button" role="option" aria-selected={value === option.value} onKeyDown={(event) => moveFocus(event, index)} onClick={() => {
        onChange(option.value);
        if (root.current) root.current.open = false;
        summary.current?.focus();
      }}>{option.label}{value === option.value && <Check size={15} aria-hidden="true" />}</button>)}
    </div>
  </details>;
}
