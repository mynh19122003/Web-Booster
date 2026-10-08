"use client";
import { translateText } from "@/lib/i18n";

import { useId, useState, type ComponentPropsWithoutRef } from "react";
import { useLanguage } from "./LanguageProvider";

/** Shared nonnegative numeric input; keeps each field's existing min/max rules. */
export function NumberInput({ onChange, onKeyDown, onPaste, min = 0, ...props }: ComponentPropsWithoutRef<"input">) {
  const { language } = useLanguage();
  const [negative, setNegative] = useState(false);
  const errorId = useId();
  const message = translateText(language, "Negative numbers are not allowed. Enter a value of 0 or greater.", "Không được nhập số âm. Vui lòng nhập số từ 0 trở lên.");
  return <>
    <input {...props} type="number" min={Math.max(0, Number(min))} inputMode={props.inputMode ?? "decimal"}
      aria-invalid={negative || props["aria-invalid"]}
      aria-describedby={[props["aria-describedby"], negative ? errorId : null].filter(Boolean).join(" ") || undefined}
      onKeyDown={(event) => {
        if (event.key === "-") { event.preventDefault(); setNegative(true); return; }
        onKeyDown?.(event);
      }}
      onPaste={(event) => {
        if (/^\s*[-−]/.test(event.clipboardData.getData("text"))) { event.preventDefault(); setNegative(true); return; }
        onPaste?.(event);
      }}
      onChange={(event) => {
        if (event.target.value.startsWith("-") || event.target.valueAsNumber < 0) { setNegative(true); return; }
        setNegative(false);
        onChange?.(event);
      }}
    />
    {negative && <span id={errorId} className="number-input-error" role="alert">{message}</span>}
  </>;
}
