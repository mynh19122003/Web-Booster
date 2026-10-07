"use client";

import {
  ShieldCheck,
  LockKeyhole,
  EyeOff,
  Fingerprint,
  Check,
} from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";

export function SecuritySection() {
  const { t } = useLanguage();
  return (
    <section className="section security-section">
      <div className="site-container split-section">
        <div className="security-diagram" aria-hidden="true">
          <div className="security-orbit orbit-one" />
          <div className="security-orbit orbit-two" />
          <div className="security-shield">
            <ShieldCheck size={75} strokeWidth={1} />
          </div>
          <span className="security-node node-1">
            <LockKeyhole /> ENCRYPTED
          </span>
          <span className="security-node node-2">
            <Fingerprint /> VERIFIED
          </span>
          <span className="security-node node-3">
            <EyeOff /> PRIVATE
          </span>
          <span className="security-node node-4">
            <ShieldCheck /> PROTECTED
          </span>
        </div>
        <div data-reveal>
          <p className="eyebrow">{t("securityEyebrow")}</p>
          <h2>
            {t("securityLead")}
            <br />
            <span className="gradient-text">{t("securityFinish")}</span>
          </h2>
          <p>
            {t("securityDescription")}
            <br />
            {t("securityDescriptionEnd")}
          </p>
          <ul className="security-list">
            <li>
              <Check /> {t("securityOne")}
            </li>
            <li>
              <Check /> {t("securityTwo")}
            </li>
            <li>
              <Check /> {t("securityThree")}
            </li>
            <li>
              <Check /> {t("securityFour")}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
