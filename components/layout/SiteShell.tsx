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
export function SiteShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isAuthRoute = path === "/login" || path.startsWith("/login/") || path === "/register" || path.startsWith("/register/");
  const isAdminRoute = path === "/admin" || path.startsWith("/admin/");
  const isEmployeeRoute = path === "/employee" || path.startsWith("/employee/");
  // Preserve main's operational shell and keep all public providers out of it.
  if (isAdminRoute || isEmployeeRoute) return <main id="main">{children}</main>;
  return (
    <LanguageProvider>
      <div data-public-site="" style={{ minHeight: "100vh" }}>
        <SkipLink />
        <CurrencyProvider />
        {isAuthRoute ? <main id="main">{children}</main> : <>
          <SceneLoader />
          <InitialLoader />
          <PointerEffects />
          <Header key={path} />
          <Experience><main id="main">{children}</main></Experience>
          <Footer />
          <Suspense fallback={null}><Dialogs /></Suspense>
        </>}
      </div>
    </LanguageProvider>
  );
}
