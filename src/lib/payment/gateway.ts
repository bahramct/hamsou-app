// ─────────────────────────────────────────────────────────────────────────────
// payment/gateway.ts — resolver درگاهِ پرداختِ فعال (DECISION-071؛ آینهٔ email/services.ts)
//
// مفهوم: هر «درگاه» یک ردیف PaymentGateway است (provider + merchantId + sandbox).
// درگاهِ فعالِ پیش‌فرض برای کلِ شارژِ آنلاین استفاده می‌شود.
//
// قاعدهٔ طلایی: این لایه هرگز throw نمی‌کند → null (و API به خطای واضح ۵۰۳ می‌افتد).
// cache کوتاه‌مدت با invalidate از پنل ادمین (مثل cards.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";

export interface ResolvedPaymentGateway {
  id: string;
  label: string;
  provider: string; // "zarinpal" | "mock"
  merchantId: string | null;
  isSandbox: boolean;
  isActive: boolean;
  isDefault: boolean;
}

const CACHE_TTL_MS = 10_000;
const globalForGateway = globalThis as unknown as {
  __hamsoo_payment_gateway_default?: { value: ResolvedPaymentGateway | null; at: number };
};

export function invalidatePaymentGatewayCache(): void {
  globalForGateway.__hamsoo_payment_gateway_default = undefined;
}

/** درگاهِ فعالِ پیش‌فرض (cache + fallback null).
 *  اگر هیچ ردیفِ isDefault نبود، تازه‌ترین درگاهِ فعال. */
export async function getActivePaymentGateway(): Promise<ResolvedPaymentGateway | null> {
  const now = Date.now();
  const cached = globalForGateway.__hamsoo_payment_gateway_default;
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;
  try {
    const row = await prisma.paymentGateway.findFirst({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
    const value: ResolvedPaymentGateway | null = row
      ? {
          id: row.id,
          label: row.label,
          provider: row.provider,
          merchantId: row.merchantId,
          isSandbox: row.isSandbox,
          isActive: row.isActive,
          isDefault: row.isDefault,
        }
      : null;
    globalForGateway.__hamsoo_payment_gateway_default = { value, at: now };
    return value;
  } catch {
    return null;
  }
}
