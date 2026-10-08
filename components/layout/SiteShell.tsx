"use client";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Dialogs } from "@/components/ui/Dialogs";
import { Experience } from "@/components/ui/Experience";
import { SceneLoader } from "@/components/three/SceneLoader";
import { PointerEffects } from "@/components/ui/PointerEffects";
import { InitialLoader } from "@/components/ui/InitialLoader";
import { CurrencyProvider } from "@/components/ui/Currency";
import { LanguageProvider } from "@/components/ui/LanguageProvider";
import { SkipLink } from "@/components/ui/SkipLink";
import { Suspense } from "react";
import { ChatLauncher } from "@/components/account/BoosterChat";
export function SiteShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isAuthRoute = path === "/login" || path.startsWith("/login/") || path === "/register" || path.startsWith("/register/");
  const isAdminRoute = path === "/admin" || path.startsWith("/admin/");

  if (isAdminRoute || isAuthRoute)
    return (
      <LanguageProvider>
        <SkipLink />
        <CurrencyProvider />
        <Experience><main id="main">{children}</main></Experience>
      </LanguageProvider>
    );
  return (
    <LanguageProvider>
      <SkipLink />
      <CurrencyProvider />
      <SceneLoader />
      <InitialLoader />
      <PointerEffects />
      <Header key={path} />
      <Experience>
        <main id="main">{children}</main>
      </Experience>
      <Footer />
      {path !== "/messages" && <ChatLauncher />}
      <Suspense fallback={null}>
        <Dialogs />
      </Suspense>
    </LanguageProvider>
  );
}
