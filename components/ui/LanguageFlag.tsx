type LanguageFlagProps = {
  code: string;
  className?: string;
};

const star = "m12 2 1.2 3.8H17l-3.1 2.3 1.2 3.8-3.1-2.4-3.1 2.4 1.2-3.8L7 5.8h3.8z";

export function LanguageFlag({ code, className = "" }: LanguageFlagProps) {
  const base = "h-[18px] w-6 shrink-0 overflow-hidden rounded-[3px] border border-white/10 shadow-sm";
  let flag: React.ReactNode;

  switch (code) {
    case "gb":
      flag = <><rect width="24" height="18" fill="#012169"/><path d="m0 0 24 18M24 0 0 18" stroke="#fff" strokeWidth="5"/><path d="m0 0 24 18M24 0 0 18" stroke="#c8102e" strokeWidth="2"/><path d="M12 0v18M0 9h24" stroke="#fff" strokeWidth="7"/><path d="M12 0v18M0 9h24" stroke="#c8102e" strokeWidth="3"/></>;
      break;
    case "us":
      flag = <><rect width="24" height="18" fill="#fff"/>{[0, 3, 6, 9, 12, 15].map((y) => <rect key={y} y={y} width="24" height="1.4" fill="#b22234"/>)}<rect width="10" height="9" fill="#3c3b6e"/><path d="m5 1.4.5 1h1.1l-.9.7.3 1.1-.9-.7-.9.7.3-1.1-.9-.7h1.1z" fill="#fff"/></>;
      break;
    case "de": flag = <><rect width="24" height="6"/><rect y="6" width="24" height="6" fill="#d00"/><rect y="12" width="24" height="6" fill="#ffce00"/></>; break;
    case "fr": case "it": case "be":
      flag = <><rect width="8" height="18" fill={code === "it" ? "#009246" : code === "be" ? "#000" : "#0055a4"}/><rect x="8" width="8" height="18" fill={code === "be" ? "#fae042" : "#fff"}/><rect x="16" width="8" height="18" fill={code === "fr" ? "#ef4135" : code === "it" ? "#ce2b37" : "#ed2939"}/></>; break;
    case "es": flag = <><rect width="24" height="18" fill="#aa151b"/><rect y="4.5" width="24" height="9" fill="#f1bf00"/><circle cx="7" cy="9" r="1.6" fill="#aa151b"/></>; break;
    case "pt": flag = <><rect width="9" height="18" fill="#006600"/><rect x="9" width="15" height="18" fill="#ff0000"/><circle cx="9" cy="9" r="3" fill="#ffcc00"/><circle cx="9" cy="9" r="1.7" fill="#fff"/></>; break;
    case "nl": flag = <><rect width="24" height="6" fill="#ae1c28"/><rect y="6" width="24" height="6" fill="#fff"/><rect y="12" width="24" height="6" fill="#21468b"/></>; break;
    case "jp": flag = <><rect width="24" height="18" fill="#fff"/><circle cx="12" cy="9" r="5" fill="#bc002d"/></>; break;
    case "cn": flag = <><rect width="24" height="18" fill="#de2910"/><path d={star} fill="#ffde00"/><circle cx="16.3" cy="3" r=".65" fill="#ffde00"/><circle cx="18.4" cy="5" r=".65" fill="#ffde00"/><circle cx="18.2" cy="8" r=".65" fill="#ffde00"/><circle cx="16.1" cy="10" r=".65" fill="#ffde00"/></>; break;
    case "ru": flag = <><rect width="24" height="6" fill="#fff"/><rect y="6" width="24" height="6" fill="#0039a6"/><rect y="12" width="24" height="6" fill="#d52b1e"/></>; break;
    case "pl": flag = <><rect width="24" height="9" fill="#fff"/><rect y="9" width="24" height="9" fill="#dc143c"/></>; break;
    case "se": flag = <><rect width="24" height="18" fill="#006aa7"/><path d="M7 0v18M0 8h24" stroke="#fecc00" strokeWidth="3"/></>; break;
    case "ro": flag = <><rect width="8" height="18" fill="#002b7f"/><rect x="8" width="8" height="18" fill="#fcd116"/><rect x="16" width="8" height="18" fill="#ce1126"/></>; break;
    case "cz": flag = <><rect width="24" height="9" fill="#fff"/><rect y="9" width="24" height="9" fill="#d7141a"/><path d="M0 0v18l12-9z" fill="#11457e"/></>; break;
    case "no": flag = <><rect width="24" height="18" fill="#ba0c2f"/><path d="M7 0v18M0 8h24" stroke="#fff" strokeWidth="5"/><path d="M7 0v18M0 8h24" stroke="#00205b" strokeWidth="2.3"/></>; break;
    case "dk": flag = <><rect width="24" height="18" fill="#c60c30"/><path d="M7 0v18M0 8h24" stroke="#fff" strokeWidth="2.5"/></>; break;
    case "fi": flag = <><rect width="24" height="18" fill="#fff"/><path d="M7 0v18M0 8h24" stroke="#003580" strokeWidth="3"/></>; break;
    case "bg": flag = <><rect width="24" height="6" fill="#fff"/><rect y="6" width="24" height="6" fill="#00966e"/><rect y="12" width="24" height="6" fill="#d62612"/></>; break;
    case "hu": flag = <><rect width="24" height="6" fill="#ce2939"/><rect y="6" width="24" height="6" fill="#fff"/><rect y="12" width="24" height="6" fill="#477050"/></>; break;
    case "hr": flag = <><rect width="24" height="6" fill="#ff0000"/><rect y="6" width="24" height="6" fill="#fff"/><rect y="12" width="24" height="6" fill="#171796"/><path d="M9 5h6v7H9z" fill="#fff"/><path d="M9 5h2v2H9zm4 0h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2H9zm4 0h2v2h-2z" fill="#e00025"/></>; break;
    case "ae": flag = <><rect width="24" height="6" fill="#00732f"/><rect y="6" width="24" height="6" fill="#fff"/><rect y="12" width="24" height="6" fill="#000"/><rect width="6" height="18" fill="#ff0000"/></>; break;
    case "tr": flag = <><rect width="24" height="18" fill="#e30a17"/><circle cx="10" cy="9" r="5" fill="#fff"/><circle cx="11.5" cy="9" r="4" fill="#e30a17"/><path d="m16 5.5 1 2.5 2.6.1-2 1.6.7 2.5-2.2-1.5-2.2 1.5.8-2.5-2.1-1.6 2.6-.1z" fill="#fff"/></>; break;
    case "vn": flag = <><rect width="24" height="18" fill="#da251d"/><path d="m12 3 1.4 4.2h4.4l-3.6 2.6 1.4 4.2-3.6-2.6-3.6 2.6 1.4-4.2-3.6-2.6h4.4z" fill="#ff0"/></>; break;
    case "kr": flag = <><rect width="24" height="18" fill="#fff"/><path d="M12 4a5 5 0 0 1 0 10 2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5" fill="#cd2e3a"/><path d="M12 14a5 5 0 0 1 0-10 2.5 2.5 0 0 0 0 5 2.5 2.5 0 0 1 0 5" fill="#0047a0"/><path d="m4 4 4 2M4 6l4 2m8 2 4 2m-4 0 4 2" stroke="#111" strokeWidth="1"/></>; break;
    default: flag = <><rect width="24" height="18" fill="#ddd"/><text x="12" y="12" textAnchor="middle" fontSize="8" fill="#111">{code.toUpperCase()}</text></>;
  }

  return <svg className={`${base} ${className}`} viewBox="0 0 24 18" aria-hidden="true" focusable="false">{flag}</svg>;
}
