import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { currentUser } from "@/lib/current-user";
import { loginDestination } from "@/lib/auth-redirect";

export const metadata = { title: "Employee sign in", robots: { index: false, follow: false } };
export default async function EmployeeLoginPage() {
  const user = await currentUser();
  if (user) redirect(loginDestination(user.role));
  return <AuthPanel initialMode="login" googleConfigured={false} audience="employee" returnTo="/employee" />;
}
