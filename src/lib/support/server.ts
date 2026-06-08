// ─────────────────────────────────────────────────────────────────────────────
// support/server.ts — کانتکست دسترسی تیکتینگ کاربر (server-only) — DECISION-044
//
// گیتِ دسترسی دقیقاً از امکانِ پلن «support.ticketing» می‌آید (هم‌ترازی پنل↔پروژه):
// به‌محض روشن‌کردن این امکان برای هر پلن از پنل، کاربرانِ آن پلن allowed می‌شوند.
// ─────────────────────────────────────────────────────────────────────────────

import { getSessionUser } from "@/lib/utils/auth-server";
import { prisma } from "@/lib/db/client";
import { planAllows } from "@/lib/plans/access";
import { getEffectivePlanKey } from "@/lib/plans/effective";
import { TICKETING_FEATURE_KEY } from "./tickets";

export interface TicketingContext {
  userId: string;
  plan: string;
  /** آیا پلنِ این کاربر اجازهٔ تیکتینگ دارد؟ (از planAllows) */
  allowed: boolean;
}

/** کانتکست تیکتینگ کاربر فعلی؛ null اگر لاگین نباشد. */
export async function getTicketingContext(): Promise<TicketingContext | null> {
  const session = await getSessionUser();
  if (!session) return null;
  const plan = await getEffectivePlanKey(session.userId); // پلنِ مؤثر با انقضا (DECISION-062)
  const allowed = await planAllows(plan, TICKETING_FEATURE_KEY);
  return { userId: session.userId, plan, allowed };
}
