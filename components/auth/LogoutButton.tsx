"use client";
import { publicRequest } from "@/services/public";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useLanguage();
  return <button className="account-logout" onClick={async () => { await publicRequest("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }}><LogOut size={16} /> {t("signOut")}</button>;
}
