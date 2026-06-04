// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/ai/bindings — اتصال یک بخش (نقش) به یک سرویس، per منطقه (DECISION-039)
//   POST : { roleKey, region, serviceId } — enforce ai.manage
//          serviceId خالی ("") = حذف اتصال → بازگشت به سرویس پیش‌فرض منطقه.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { prisma } from "@/lib/db/client";
import { setAiConfig } from "@/lib/ai/config";
import { AI_CONFIG_KEYS, getAiRoleAdminMeta } from "@/lib/ai/admin-catalog";

const REGIONS = ["IR", "INTL"];

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "ai.manage")) return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });

  const roleKey = String(b.roleKey ?? "");
  const region = String(b.region ?? "");
  const serviceId = typeof b.serviceId === "string" ? b.serviceId.trim() : "";

  const roleMeta = getAiRoleAdminMeta(roleKey);
  if (!roleMeta) return NextResponse.json({ error: "بخش (نقش) نامعتبر." }, { status: 400 });
  if (!REGIONS.includes(region)) return NextResponse.json({ error: "منطقهٔ نامعتبر." }, { status: 400 });

  // serviceId غیرخالی → سرویس باید موجود، با نوعِ مطابق نقش باشد (هم‌خوانی text/image)
  if (serviceId) {
    const svc = await prisma.aiService.findUnique({
      where: { id: serviceId },
      select: { kind: true },
    });
    if (!svc) return NextResponse.json({ error: "سرویس انتخاب‌شده یافت نشد." }, { status: 400 });
    if (svc.kind !== roleMeta.serviceKind) {
      return NextResponse.json(
        { error: `این بخش به سرویس «${roleMeta.serviceKind === "text" ? "متنی" : "تصویری"}» نیاز دارد.` },
        { status: 400 }
      );
    }
  }

  await setAiConfig(AI_CONFIG_KEYS.binding(roleKey, region), serviceId, ctx.admin.id);

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "ai.binding.set",
    targetType: "ai-binding",
    targetId: `${roleKey}.${region}`,
    meta: { serviceId: serviceId || "(default)" },
  });

  return NextResponse.json({ ok: true });
}
