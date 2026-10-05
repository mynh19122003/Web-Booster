"use client";

import Image from "next/image";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./RegionSelector.module.css";

export type RegionOption = { code: string; name: string; flag: string };

export function RegionSelector({ options, value, onChange, label = "Region" }: {
  options: readonly RegionOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.code === value);
  const filtered = options.filter((option) => `${option.name} ${option.code}`.toLowerCase().includes(query.trim().toLowerCase()));

  function close() { dialog.current?.close(); }
  function navigate(event: KeyboardEvent<HTMLDialogElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    if (event.target === search.current && event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>("[data-region-option]") ?? []);
    if (!items.length) return;
    event.preventDefault();
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : index < 0 ? (event.key === "ArrowDown" ? 0 : items.length - 1) : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  }

  return <div className={styles.field}>
    <span id={`${id}-label`} className={styles.label}>{label.toUpperCase()}</span>
    <button ref={trigger} className={styles.trigger} type="button" aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-dialog`} onClick={() => {
      setQuery(""); setOpen(true); dialog.current?.showModal(); search.current?.focus();
    }}>
      {selected && <Image className={styles.flag} src={selected.flag} alt="" width={24} height={18} unoptimized />}
      <span id={`${id}-value`} className={styles.value}>{selected?.name ?? value}</span>
      <ChevronDown size={16} aria-hidden="true" />
    </button>
    <dialog ref={dialog} id={`${id}-dialog`} className={styles.modal} aria-labelledby={`${id}-title`} onKeyDown={navigate} onClose={() => { setOpen(false); trigger.current?.focus(); }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
    }}>
      <div className={styles.header}><h2 id={`${id}-title`}>Select {label.toLowerCase()}</h2><button type="button" className={styles.close} aria-label="Close region selector" onClick={close}><X size={20} /></button></div>
      <div className={styles.search}><Search size={18} aria-hidden="true" /><input ref={search} aria-label={`Search ${label.toLowerCase()}`} placeholder="Search by name or code" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className={styles.list} role="group" aria-label={`Available ${label.toLowerCase()} options`}>
        {filtered.map((option) => <button key={option.code} type="button" data-region-option className={styles.option} aria-pressed={value === option.code} onClick={() => { onChange(option.code); close(); }}>
          <Image className={styles.flag} src={option.flag} alt="" width={24} height={18} unoptimized /><span className={styles.name}>{option.name}<small>{option.code}</small></span>{value === option.code && <Check size={18} aria-hidden="true" />}
        </button>)}
        {!filtered.length && <p className={styles.empty} role="status">No regions found.</p>}
      </div>
    </dialog>
  </div>;
}
