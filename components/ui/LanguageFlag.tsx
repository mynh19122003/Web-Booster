import Image from "next/image";

type LanguageFlagProps = { code: string; className?: string };
export function LanguageFlag({ code, className = "" }: LanguageFlagProps) {
  const countryCode = code.toLowerCase();
  if (!/^[a-z]{2}$/.test(countryCode)) return null;
  return <Image className={`country-flag-image ${className}`} src={`/images/flags/${countryCode}.svg`} alt="" width={24} height={18} />;
}
