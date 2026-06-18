// ─────────────────────────────────────────────────────────────────────────────
// صفحهٔ ورود — Server Component wrapper
//
// کاربرِ لاگین‌شده: فوری redirect می‌شود — به returnUrl (اگر امن باشد) یا /dashboard
// کاربرِ لاگین‌نشده: LoginClient رندر می‌شود (فرمِ OTP / ایمیل)
// ─────────────────────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/utils/auth-server";
import { LoginClient } from "./LoginClient";

/** مسیر نسبیِ امن — open redirect را می‌بندد */
function safeDest(raw: string | string[] | undefined): string {
  const val = Array.isArray(raw) ? raw[0] : raw;
  if (!val || !val.startsWith("/") || val.startsWith("//")) return "/dashboard";
  return val;
}

interface Props {
  searchParams: Promise<{ returnUrl?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const [session, sp] = await Promise.all([getSessionUser(), searchParams]);

  // کاربرِ لاگین‌شده نباید صفحهٔ لاگین ببیند
  if (session) {
    redirect(safeDest(sp.returnUrl));
  }

  return <LoginClient />;
}
