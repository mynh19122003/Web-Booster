"use client";
import { LoaderCircle } from "lucide-react";

export function CoachDataLoading({ label }: { label: string }) {
  return <div className="coach-data-loading" role="status" aria-live="polite">
    <span><LoaderCircle size={18} aria-hidden="true" />{label}</span>
    <progress aria-label={label} />
  </div>;
}
