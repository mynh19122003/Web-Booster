"use client";
import { Check } from "lucide-react";

export function ProfileChecklist({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (values: string[]) => void;
}) {
  const values = [...new Set([...options, ...selected])];
  return <fieldset className="coach-profile-checklist"><legend>{label}</legend><div>{values.map(value => <label key={value} data-selected={selected.includes(value)}>
    <input type="checkbox" checked={selected.includes(value)} onChange={event => onChange(event.target.checked ? [...selected, value] : selected.filter(item => item !== value))} />
    <span>{value}</span>{selected.includes(value) && <Check size={14} aria-hidden="true" />}
  </label>)}</div></fieldset>;
}
