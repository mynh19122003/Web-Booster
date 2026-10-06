"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { AscendLogo } from "@/components/ui/AscendLogo";
import { BackToHomeButton } from "@/components/ui/BackToHomeButton";

type Mode = "login" | "register";

const googleErrors: Record<string, string> = {
  "google-unconfigured": "Google sign-in is not configured yet. You can use email and password.",
  "google-email-exists": "An account already uses this email. Sign in with your password first.",
  "google-failed": "Google sign-in could not be completed. Please try again.",
};

export function AuthPanel({ initialMode, googleConfigured, error }: { initialMode: Mode; googleConfigured: boolean; error?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [message, setMessage] = useState(error ? googleErrors[error] || "Sign-in could not be completed." : "");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    if (mode === "register" && payload.password !== payload.confirmPassword) {
      setMessage("Your passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      router.push("/account");
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to sign in right now.");
      setBusy(false);
    }
  }

  return (
    <main className="auth-page min-h-screen relative flex items-center justify-center p-4 sm:p-8 md:p-12" id="main">
      <BackToHomeButton />
      <div className="auth-layout shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10">
        <aside className="auth-aside">
          <Link className="auth-brand" href="/" aria-label="ASCEND home">
            <AscendLogo variant="horizontal" size="md" />
          </Link>
          <div className="auth-aside-copy">
            <p className="eyebrow">YOUR ASCEND SPACE</p>
            <h1>Every plan,<br />in your corner.</h1>
            <p>Keep your game plans close and pick up where you left off.</p>
          </div>
          <span className="auth-aside-index">PLAYER ACCOUNT <span>01 / 03</span></span>
        </aside>

        <section className="auth-content" aria-labelledby="auth-heading">
          <div className="auth-form-wrap">
            <div className="auth-tabs" role="tablist" aria-label="Account access">
              <button role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setMessage(""); }}>Sign in</button>
              <button role="tab" aria-selected={mode === "register"} onClick={() => { setMode("register"); setMessage(""); }}>Create account</button>
            </div>
            <p className="eyebrow">WELCOME {mode === "login" ? "BACK" : "TO ASCEND"}</p>
            <h2 id="auth-heading">{mode === "login" ? "Sign in." : "Create your account."}</h2>
            <p className="auth-description">{mode === "login" ? "Enter your details to continue." : "A few details and your space is ready."}</p>

            <form className="auth-form" onSubmit={submit}>
              {mode === "register" && <label>Full name<input name="name" autoComplete="name" minLength={2} maxLength={80} placeholder="Your name" required /></label>}
              <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required /></label>
              <label>Password<div className="password-field"><input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} maxLength={128} placeholder="At least 8 characters" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
              {mode === "register" && <label>Confirm password<div className="password-field"><input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} placeholder="Enter password again" required /><button type="button" aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>}
              <button className="button auth-submit" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}<ArrowUpRight size={16} /></button>
              {message && <p className="auth-message" role="alert">{message}</p>}
            </form>

            <div className="auth-divider"><span>OR CONTINUE WITH</span></div>
            <div className="auth-providers">
              <a className="auth-provider" href="/api/auth/google" aria-disabled={!googleConfigured} onClick={(event) => { if (!googleConfigured) { event.preventDefault(); setMessage("Add Google OAuth credentials to .env.local to enable Google sign-in."); } }}>
                <GoogleMark /> <span>Google</span>
              </a>
              <button className="auth-provider" type="button" onClick={() => setMessage("Riot Games sign-in is a visual preview and is not connected.")}><Image src="/images/logos/riot-games-mark.png" alt="" width={20} height={20} style={{ objectFit: "contain" }} /><span>Riot Games</span></button>
            </div>
            <p className="auth-legal">By continuing, you agree to our <Link href="/legal/terms">Terms</Link> and <Link href="/legal/privacy">Privacy Policy</Link>.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.4l-3.24-2.52c-.9.6-2.05.97-3.38.97-2.6 0-4.8-1.76-5.6-4.12H3.05v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.93a6 6 0 0 1 0-3.86v-2.6H3.05a10 10 0 0 0 0 9.06l3.35-2.6Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.8.5 3.84 1.52l2.88-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.95 5.47l3.35 2.6c.8-2.36 3-4.12 5.6-4.12Z"/></svg>;
}
