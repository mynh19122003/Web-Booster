import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";

export const metadata: Metadata = {
  title: "Sign in or create an account",
  description: "Sign in to your ASCEND account or create one to keep your plans together.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  return <AuthPanel initialMode={mode === "register" ? "register" : "login"} googleConfigured={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} error={error} />;
}
