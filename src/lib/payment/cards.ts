// ─────────────────────────────────────────────────────────────────────────────
// payment/cards.ts — resolver کارتِ مرجعِ دریافت (DECISION-062؛ آینهٔ sms/services.ts)
//
// کارتِ پیش‌فرضِ فعال برای نمایش هنگام شارژ کیف‌پول استفاده می‌شود.
// قاعدهٔ طلایی: هرگز throw نمی‌کند → null. cache کوتاه‌مدت با invalidate از API.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";

export interface ResolvedBankCard {
  id: string;
  holderName: string;
  cardNumber: string;
  bankName: string;
  isActive: boolean;
  isDefault: boolean;
}

const CACHE_TTL_MS = 10_000;
const globalForCards = globalThis as unknown as {
  __hamsoo_bankcard_default?: { value: ResolvedBankCard | null; at: number };
};

export function invalidateBankCardCache(): void {
  globalForCards.__hamsoo_bankcard_default = undefined;
}

/** کارتِ مرجعِ پیش‌فرضِ فعال (cache + fallback null). */
export async function getDefaultBankCard(): Promise<ResolvedBankCard | null> {
  const now = Date.now();
  const cached = globalForCards.__hamsoo_bankcard_default;
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;
  try {
    const row = await prisma.bankCard.findFirst({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
    const value: ResolvedBankCard | null = row
      ? {
          id: row.id,
          holderName: row.holderName,
          cardNumber: row.cardNumber,
          bankName: row.bankName,
          isActive: row.isActive,
          isDefault: row.isDefault,
        }
      : null;
    globalForCards.__hamsoo_bankcard_default = { value, at: now };
    return value;
  } catch {
    return null;
  }
}
