// ─────────────────────────────────────────────────────────────────────────────
// email/services.ts — resolver سرویس‌های ایمیل (DECISION-064؛ آینهٔ sms/services.ts)
//
// مفهوم: هر «سرویس ایمیل» یک ردیف EmailService است (provider + apiKey + fromAddress).
// سرویسِ فعالِ پیش‌فرض برای کل سیستم استفاده می‌شود؛ نبود سرویس → fallback mock.
//
// قاعدهٔ طلایی: این لایه هرگز throw نمی‌کند. اگر DB در دسترس نبود یا سرویسی پیدا
// نشد → null برمی‌گرداند و send.ts به mock می‌افتد.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";

export interface ResolvedEmailService {
  id: string;
  label: string;
  provider: string; // "resend" | "smtp" | "mock"
  apiKey: string | null;
  fromAddress: string;
  fromName: string;
  isActive: boolean;
  isDefault: boolean;
}

// ─── cache مشترک per-process ──────────────────────────────────────────────────
const CACHE_TTL_MS = 10_000;

interface CacheEntry<T> {
  value: T;
  at: number;
}

const globalForEmail = globalThis as unknown as {
  __hamsoo_email_default?: CacheEntry<ResolvedEmailService | null>;
  __hamsoo_email_by_id?: Map<string, CacheEntry<ResolvedEmailService | null>>;
};
const byIdCache =
  globalForEmail.__hamsoo_email_by_id ??
  (globalForEmail.__hamsoo_email_by_id = new Map());

export function invalidateEmailServiceCache(): void {
  globalForEmail.__hamsoo_email_default = undefined;
  byIdCache.clear();
}

interface EmailServiceRow {
  id: string;
  label: string;
  provider: string;
  apiKey: string | null;
  fromAddress: string;
  fromName: string;
  isActive: boolean;
  isDefault: boolean;
}

function rowToService(r: EmailServiceRow): ResolvedEmailService {
  return { ...r };
}

/** سرویسِ فعالِ پیش‌فرض را برمی‌گرداند (cache + fallback null).
 *  اگر هیچ ردیفِ isDefault نبود، تازه‌ترین سرویسِ فعال. */
export async function getDefaultEmailService(): Promise<ResolvedEmailService | null> {
  const now = Date.now();
  const cached = globalForEmail.__hamsoo_email_default;
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;
  try {
    const row = await prisma.emailService.findFirst({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
    const value = row ? rowToService(row) : null;
    globalForEmail.__hamsoo_email_default = { value, at: now };
    return value;
  } catch {
    return null;
  }
}

export async function getEmailServiceById(id: string): Promise<ResolvedEmailService | null> {
  const now = Date.now();
  const cached = byIdCache.get(id);
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;
  try {
    const row = await prisma.emailService.findUnique({ where: { id } });
    const value = row ? rowToService(row) : null;
    byIdCache.set(id, { value, at: now });
    return value;
  } catch {
    return null;
  }
}
