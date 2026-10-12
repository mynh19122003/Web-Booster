import { cookies } from "next/headers";
import { getUserForSession } from "@/lib/auth-db";
import { SESSION_COOKIE } from "@/lib/auth-http";

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? getUserForSession(token) : null;
}
