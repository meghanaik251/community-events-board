import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate, getSecret, SESSION_COOKIE } from "./auth";
import { getDb } from "./db";

export async function requirePageUser(admin = false) {
  const user = await authenticate(
    getDb(),
    (await cookies()).get(SESSION_COOKIE)?.value,
    getSecret(),
  );
  if (!user) redirect(admin ? "/admin/login" : "/login");
  if (admin && user.role !== "admin") redirect("/events");
  return user;
}
