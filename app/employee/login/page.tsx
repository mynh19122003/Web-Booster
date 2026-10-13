import { AuthPanel } from "@/components/auth/AuthPanel";
export default function Page() {
  return <AuthPanel initialMode="login" googleConfigured={false} audience="employee" returnTo="/employee" />;
}
