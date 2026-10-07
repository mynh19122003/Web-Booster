"use client";

import Image from "next/image";
import { ChevronDown, Search, Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { intlLocales } from "@/lib/i18n";
import { internationalPhone, phoneCountries, phoneCountryForLanguage } from "@/lib/phone-countries";
import { useLanguage } from "./LanguageProvider";

export function PhoneNumberField() {
  const { language, t } = useLanguage();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [chosenCountry, setChosenCountry] = useState<string | null>(null);
  const [national, setNational] = useState("");
  const [open, setOpen] = useState(false);
  const [menuAbove, setMenuAbove] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);
  const country = phoneCountries.find((item) => item.code === (chosenCountry ?? phoneCountryForLanguage(language)))!;
  const names = new Intl.DisplayNames([intlLocales[language]], { type: "region" });
  const countryName = (code: string) => names.of(code.toUpperCase()) ?? code.toUpperCase();
  const options = phoneCountries.filter((item) => `${countryName(item.code)} ${item.code} +${item.dial}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a, b) => countryName(a.code).localeCompare(countryName(b.code), intlLocales[language]));
  const formatted = internationalPhone(country.code, national);
  const invalid = Boolean(national.trim()) && (national.replace(/\D/g, "").length < 6 || formatted.replace(/\D/g, "").length > 15);
  const errorText = language === "vi" ? "Vui lòng nhập số điện thoại hợp lệ (6 chữ số trở lên, tối đa 15 chữ số gồm mã quốc gia)." : "Enter a valid phone number (at least 6 digits, up to 15 including the country code).";

  useEffect(() => { inputRef.current?.setCustomValidity(invalid ? errorText : ""); }, [invalid, errorText]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  return <div className="phone-field" ref={root} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <div className="phone-field-label"><label htmlFor={id}>{t("phoneNumber")}</label><span>{t("optional")}</span></div>
    <div className="phone-input-shell" data-invalid={error && invalid} dir="ltr">
      <button ref={trigger} type="button" className="phone-country-trigger" title={countryName(country.code)} aria-expanded={open} aria-controls={`${id}-countries`} aria-label={`${language === "vi" ? "Chọn mã quốc gia" : "Choose country code"}: ${countryName(country.code)} +${country.dial}`} onClick={() => {
        const bounds = root.current?.getBoundingClientRect();
        setMenuAbove(Boolean(bounds && bounds.top > 300 && window.innerHeight - bounds.bottom < 300));
        setQuery(""); setOpen(!open);
      }}>
        <Image src={`/images/phone-flags/${country.code}.svg`} width={22} height={22} alt="" /><span>+{country.dial}</span><ChevronDown size={14} aria-hidden="true" />
      </button>
      <input ref={inputRef} id={id} name="phone-national" className="phone-national-input" type="tel" inputMode="tel" autoComplete="tel-national" value={national} placeholder={language === "vi" ? "Số điện thoại" : "Phone number"} maxLength={24} aria-invalid={error && invalid} aria-describedby={`${id}-hint${error && invalid ? " " + id + "-error" : ""}`}
        onChange={(event) => {
          let value = event.target.value;
          // Accept an international number pasted into the national-number field.
          if (value.trim().startsWith("+")) {
            const digits = value.replace(/\D/g, "");
            const matching = [...phoneCountries].sort((a, b) => b.dial.length - a.dial.length).find((item) => digits.startsWith(item.dial));
            if (matching) { setChosenCountry(matching.code); value = digits.slice(matching.dial.length); }
          }
          if (!/^[\d\s().-]*$/.test(value)) return;
          setChosenCountry((selected) => selected ?? country.code);
          setNational(value); setError(false);
        }}
        onBlur={(event) => { setError(invalid); event.currentTarget.setCustomValidity(invalid ? errorText : ""); }}
        onInvalid={() => setError(true)}
      />
      <input type="hidden" name="phone" value={formatted} />
    </div>
    <small id={`${id}-hint`} className="phone-field-hint">{national && !invalid ? formatted : language === "vi" ? "Nhập số trong nước, không cần thêm mã +" + country.dial + "." : "Enter your local number without +" + country.dial + "."}</small>
    {open && <div id={`${id}-countries`} className="phone-country-menu" data-side={menuAbove ? "above" : "below"} dir="ltr">
      <label className="phone-country-search"><Search size={15} aria-hidden="true" /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={language === "vi" ? "Tìm quốc gia hoặc mã…" : "Search country or code…"} aria-label={language === "vi" ? "Tìm quốc gia" : "Search country"} onKeyDown={(event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); root.current?.querySelector<HTMLButtonElement>(".phone-country-option")?.focus(); }
      }} /></label>
      <div className="phone-country-options" onKeyDown={(event) => {
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
        const index = buttons.indexOf(event.target as HTMLButtonElement);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus(); }
      }}>
        {options.map((item) => <button type="button" className="phone-country-option" key={item.code} aria-pressed={item.code === country.code} onClick={() => { setChosenCountry(item.code); setOpen(false); trigger.current?.focus(); }}>
          <Image src={`/images/phone-flags/${item.code}.svg`} width={22} height={22} alt="" /><span className="phone-dial-code">+{item.dial}</span><span>{countryName(item.code)}</span>{item.code === country.code && <Check size={15} aria-hidden="true" />}
        </button>)}
        {!options.length && <p>{language === "vi" ? "Không tìm thấy quốc gia" : "No matching countries"}</p>}
      </div>
    </div>}
    {error && invalid && <span id={`${id}-error`} className="phone-error" role="alert">{errorText}</span>}
  </div>;
}
