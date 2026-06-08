// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/payment/cards — فهرست + ساخت کارتِ مرجع (DECISION-062؛ آینهٔ sms/services)
//   GET  : فهرست — enforce payment.read
//   POST : ساخت — enforce payment.manage
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { invalidateBankCardCache } from "@/lib/payment/cards";
import { onlyDigits } from "@/lib/utils/digits";

interface CardInput {
  holderName: string;
  cardNumber: string;
  bankName: string;
  isActive: boolean;
  isDefault: boolean;
  note: string | null;
}

function parseBody(body: unknown): { ok: true; data: CardInput } | { ok: false; error: string } {
  const b = body as Record<string, unknown>;
  const holderName = typeof b?.holderName === "string" ? b.holderName.trim() : "";
  if (!holderName) return { ok: false, error: "نام صاحب کارت خالی است." };
  const cardNumber = typeof b?.cardNumber === "string" ? onlyDigits(b.cardNumber) : "";
  if (cardNumber.length !== 16) return { ok: false, error: "شماره کارت باید ۱۶ رقم باشد." };
  const bankName = typeof b?.bankName === "string" ? b.bankName.trim() : "";
  if (!bankName) return { ok: false, error: "نام بانک خالی است." };
  const note = typeof b?.note === "string" && b.note.trim() ? b.note.trim() : null;
  return {
    ok: true,
    data: {
      holderName,
      cardNumber,
      bankName,
      isActive: b?.isActive !== false,
      isDefault: b?.isDefault === true,
      note,
    },
  };
}

export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "payment.read")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const cards = await prisma.bankCard.findMany({
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ ok: true, cards });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "payment.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const parsed = parseBody(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const d = parsed.data;

  const created = await prisma.$transaction(async (db) => {
    if (d.isDefault) {
      await db.bankCard.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    return db.bankCard.create({ data: { ...d, createdById: ctx.admin.id } });
  });

  invalidateBankCardCache();
  await logAdminAction({
    actorId: ctx.admin.id,
    action: "payment.card.create",
    targetType: "bank-card",
    targetId: created.id,
    meta: { holderName: d.holderName, bankName: d.bankName, isDefault: d.isDefault },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
