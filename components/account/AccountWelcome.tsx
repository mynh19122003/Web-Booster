"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";

export function AccountWelcome({ name, email }: { name: string; email: string }) {
  const { t } = useLanguage();
  return (
    <main className="account-page" id="main">
      <section className="account-content">
        <p className="eyebrow">{t("authSpace")}</p>
        <h1>{t("accountWelcome", { name })}</h1>
        <p>{t("signedInAs")} <strong>{email}</strong>.</p>
        <Link className="button" href="/services">{t("exploreServices")} <ArrowUpRight size={16} /></Link>
      </section>
    </main>
  );
}
