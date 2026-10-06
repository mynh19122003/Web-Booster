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
export function SiteShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isAuthRoute = path === "/login" || path.startsWith("/login/") || path === "/register" || path.startsWith("/register/");
  const isAdminRoute = path === "/admin" || path.startsWith("/admin/");

  if (isAdminRoute || isAuthRoute)
    return (
      <>
        <CurrencyProvider />
        <main id="main">{children}</main>
      </>
    );
  return (
    <>
      <CurrencyProvider />
      <SceneLoader />
      <InitialLoader />
      <PointerEffects />
      <Header />
      <Experience>
        <main id="main">{children}</main>
      </Experience>
      <Footer />
      <Dialogs />
    </>
  );
}
