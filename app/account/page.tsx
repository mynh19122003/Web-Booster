import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowUpRight, Hexagon } from "lucide-react";
import { getUserForSession } from "@/lib/auth-db";
import { SESSION_COOKIE } from "@/lib/auth-http";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = token ? getUserForSession(token) : null;
  if (!user) redirect("/login");
  return (
    <main className="account-page" id="main">
      <div className="account-top"><Link className="auth-brand" href="/"><Hexagon size={27} /><span>ASCEND<span className="logo-dot">®</span></span></Link><LogoutButton /></div>
      <section className="account-content">
        <p className="eyebrow">YOUR ASCEND SPACE</p>
        <h1>Welcome, {user.name.split(" ")[0]}.</h1>
        <p>You’re signed in as <strong>{user.email}</strong>.</p>
        <Link className="button" href="/services">Explore services <ArrowUpRight size={16} /></Link>
      </section>
    </main>
  );
}
