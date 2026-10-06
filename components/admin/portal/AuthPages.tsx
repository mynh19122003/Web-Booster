"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import { adminAuthService } from "@/services/admin";
import { Field } from "./Ui";
function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="ap-auth">
      <aside className="ap-auth-story">
        <Link href="/" className="ap-brand">
          <span className="ap-mark">A</span>
          <span>
            ASCEND<small>A HIGHER STANDARD</small>
          </span>
        </Link>
        <div className="ap-auth-art" aria-hidden="true">
          <div className="ap-orbit one" />
          <div className="ap-orbit two" />
          <div className="ap-orbit three" />
          <span className="ap-art-a">A</span>
          <span className="ap-art-label">PRECISION. PEOPLE. PROGRESS.</span>
        </div>
        <div className="ap-auth-copy">
          <span className="ap-eyebrow">THE PEOPLE BEHIND THE PROGRESS</span>
          <h1>
            Great teams.
            <br />
            Greater possibilities.
          </h1>
          <p>
            Your command center for talent, trust, and the next level of gaming
            services.
          </p>
        </div>
        <footer>
          <span>© 2026 ASCEND</span>
          <span>
            <ShieldCheck size={14} /> A workspace built on trust
          </span>
        </footer>
      </aside>
      <section className="ap-auth-form">
        <div className="ap-auth-top">
          <span>TEAM WORKSPACE</span>
          <Link href="/">
            Back to website <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="ap-auth-form-inner">{children}</div>
        <p className="ap-auth-bottom">
          <LockKeyhole size={13} /> Admin access is reserved for invited team
          members.
        </p>
      </section>
    </div>
  );
}
export function LoginPage({ changed = false }: { changed?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"owner" | "staff" | "viewer">("owner");
  const [email, setEmail] = useState("alex@ascend.demo");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [help, setHelp] = useState(false);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    try {
      await adminAuthService.login(email, String(data.get("password")), mode);
      router.push("/admin");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Sign-in unavailable. Please retry.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <AuthFrame>
      <span className="ap-auth-icon">
        <ShieldCheck size={24} />
      </span>
      <div className="ap-eyebrow">WELCOME BACK</div>
      <h2>Your workspace awaits.</h2>
      <p className="ap-auth-description">
        Sign in to manage your team and keep things moving.
      </p>
      {changed && (
        <p className="ap-success">
          Demo password updated. All previous sessions were revoked. Sign in
          again.
        </p>
      )}
      <div className="ap-demo-switch">
        <span>EXPLORE AS</span>
        <div>
          {(["owner", "staff", "viewer"] as const).map((m) => (
            <button
              type="button"
              key={m}
              className={mode === m ? "active" : ""}
              onClick={() => {
                setMode(m);
                setEmail(
                  m === "owner"
                    ? "alex@ascend.demo"
                    : m === "staff"
                      ? "olivia@ascend.demo"
                      : "sofia@ascend.demo",
                );
              }}
            >
              {m === "owner"
                ? "Super admin"
                : m === "staff"
                  ? "Staff"
                  : "View-only staff"}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={login}>
        <Field label="Email address">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </Field>
        <Field label="Password">
          <span className="ap-password-input">
            <input
              type={show ? "text" : "password"}
              name="password"
              minLength={8}
              required
              placeholder="Any demo password, 8+ characters"
              autoComplete="current-password"
            />
            <button
              type="button"
              aria-label={show ? "Hide password" : "Show password"}
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </Field>
        <div className="ap-login-help">
          <span>Demo session · this tab only</span>
          <button type="button" onClick={() => setHelp(!help)}>
            Forgot password?
          </button>
        </div>
        {help && (
          <p className="ap-info-strip">
            Password recovery is not connected yet. Contact your workspace
            owner. For this demo, use any 8+ character password.
          </p>
        )}
        {error && (
          <p className="ap-error" role="alert">
            {error}
          </p>
        )}
        <button className="ap-button primary full" disabled={pending}>
          {pending ? "Opening workspace…" : "Sign in to workspace"}
          <ArrowRight size={17} />
        </button>
      </form>
      <p className="ap-demo-disclaimer">
        You’re exploring a local demo. Use made-up credentials.
        <br />
        No backend requests or real emails are sent.
      </p>
      <div className="ap-auth-invitation">
        Joining the team?{" "}
        <Link href="/admin/accept-invitation?token=demo-invitation">
          Preview an invitation <ArrowUpRight size={14} />
        </Link>
      </div>
    </AuthFrame>
  );
}
export function AcceptInvitationPage({ token }: { token: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  async function accept(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    try {
      await adminAuthService.acceptInvitation(
        String(data.get("token")),
        String(data.get("password")),
        String(data.get("confirmation")),
        {
          phone: String(data.get("phone")),
          country: String(data.get("country")),
          timezone: String(data.get("timezone")),
        },
      );
      setSuccess(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to accept this invitation.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <AuthFrame>
      {success ? (
        <div className="ap-accept-success">
          <CheckCircle2 size={52} />
          <h2>You’re part of the team.</h2>
          <p>
            Your staff account is ready. Sign in using the Staff demo mode to
            explore your workspace.
          </p>
          <Link className="ap-button primary full" href="/admin/login">
            Continue to sign in <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <>
          <span className="ap-auth-icon">
            <MailIcon />
          </span>
          <div className="ap-eyebrow">A NEW CHAPTER</div>
          <h2>You’ve been invited.</h2>
          <p className="ap-auth-description">
            Join the ASCEND team. Set up your password to get started.
          </p>
          <form onSubmit={accept}>
            <Field label="Invitation token">
              <input
                name="token"
                defaultValue={token}
                required
                placeholder="Paste the token from your invitation"
              />
            </Field>
            <div className="ap-form-grid">
              <Field label="Password">
                <input
                  name="password"
                  type="password"
                  minLength={12}
                  maxLength={128}
                  required
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm password">
                <input
                  name="confirmation"
                  type="password"
                  required
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <p className="ap-form-hint">
              12+ characters, uppercase, lowercase, number and symbol.
            </p>
            <div className="ap-form-grid">
              <Field label="Phone (optional)">
                <input
                  name="phone"
                  type="tel"
                  maxLength={30}
                  placeholder="+84"
                />
              </Field>
              <Field label="Country">
                <select name="country">
                  <option value="VN">Vietnam</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </Field>
            </div>
            <Field label="Timezone">
              <select name="timezone">
                <option>Asia/Ho_Chi_Minh</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
              </select>
            </Field>
            {error && (
              <p className="ap-error" role="alert">
                {error}
              </p>
            )}
            <button className="ap-button primary full" disabled={pending}>
              {pending ? "Setting up your account…" : "Accept invitation"}
              <ArrowRight size={16} />
            </button>
          </form>
          <p className="ap-demo-disclaimer">
            Demo onboarding. No real password is stored.
            <br />
            Invitation links expire after 24 hours and can only be used once.
          </p>
          <Link className="ap-text-link" href="/admin/login">
            Already have an account? Sign in →
          </Link>
        </>
      )}
    </AuthFrame>
  );
}
function MailIcon() {
  return <ArrowUpRight size={24} />;
}
