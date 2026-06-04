// ─────────────────────────────────────────────────────────────────────────────
// auth-server.ts — خواندن session کاربر در محیط سرور
//
// استفاده:
//   - Server Components  → مستقیم فراخوانی کن
//   - API Route Handlers → مستقیم فراخوانی کن
//   - Client Components  → هرگز import نکن (Next.js خطا می‌دهد)
//
// این تابع از `cookies()` استفاده می‌کند که فقط در server runtime موجود است.
// ─────────────────────────────────────────────────────────────────────────────

import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "./session";
import { prisma } from "@/lib/db/client";

export interface AuthUser {
  userId: string;
  phone: string;
}

/**
 * خواندن و تأیید session JWT از cookie
 * @returns اطلاعات کاربر یا null اگر session وجود ندارد / معتبر نیست / کاربر مسدود است
 *
 * نکته (اصل هم‌ترازی ادمین↔پروژه): کاربری که از پنل ادمین `isBanned` شده،
 * نباید به اپ دسترسی داشته باشد. چون JWT تا انقضا معتبر می‌ماند، وضعیت ban
 * را از DB چک می‌کنیم (lookup روی PK، سبک). banned → مثل بدون‌session رفتار می‌شود.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const result = await verifySessionToken(token);
    if (!result.valid || !result.payload) return null;

    // enforce ban — نقطهٔ متناظر پروژه‌ای فیچر «مسدودسازی» در پنل ادمین
    const user = await prisma.user.findUnique({
      where: { id: result.payload.userId },
      select: { isBanned: true },
    });
    if (!user || user.isBanned) return null;

    return result.payload;
  } catch {
    return null;
  }
}
