// /api/admin/livechat/settings — تنظیمات چت آنلاین (DECISION-049)
//   GET  : مقادیر فعلی (enforce: support.read)
//   POST : ذخیره (enforce: support.respond) — روشن/خاموش، متن خوش‌آمد، ساعات کاری
// مقادیر در AppSetting ذخیره می‌شوند؛ تغییر بلافاصله (با invalidate cache) اعمال می‌شود.

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { getAppSettingMany, setAppSetting } from "@/lib/settings/app-settings";
import {
  SUPPORT_CHAT_KEYS,
  DEFAULT_WELCOME,
  DEFAULT_WORKING_HOURS,
  parseWorkingHours,
} from "@/lib/support/chat";

export const dynamic = "force-dynamic";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });
  if (!can(ctx, "support.read")) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const raw = await getAppSettingMany([
    SUPPORT_CHAT_KEYS.enabled,
    SUPPORT_CHAT_KEYS.welcome,
    SUPPORT_CHAT_KEYS.hours,
  ]);

  return NextResponse.json({
    ok: true,
    enabled: (raw[SUPPORT_CHAT_KEYS.enabled] ?? "true").toLowerCase() === "true",
    welcome: raw[SUPPORT_CHAT_KEYS.welcome] ?? DEFAULT_WELCOME,
    hours: parseWorkingHours(raw[SUPPORT_CHAT_KEYS.hours] ?? null) ?? DEFAULT_WORKING_HOURS,
  });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });
  if (!can(ctx, "support.respond")) {
    return NextResponse.json({ ok: false, error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "درخواست نامعتبر" }, { status: 400 });
  }

  // enabled
  const enabled = body.enabled === true || body.enabled === "true";

  // welcome — غیرخالی، حداکثر ۶۰۰ نویسه
  const welcome = typeof body.welcome === "string" ? body.welcome.trim() : "";
  if (!welcome) {
    return NextResponse.json({ ok: false, error: "متن خوش‌آمد خالی است." }, { status: 400 });
  }
  if (welcome.length > 600) {
    return NextResponse.json({ ok: false, error: "متن خوش‌آمد طولانی است." }, { status: 400 });
  }

  // hours — اعتبارسنجی ساختار (parseWorkingHours خطا را به پیش‌فرض می‌برد، پس صریح چک می‌کنیم)
  const hoursInput = body.hours;
  const days = Array.isArray(hoursInput?.days)
    ? hoursInput.days.filter((n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= 6)
    : [];
  if (days.length === 0) {
    return NextResponse.json({ ok: false, error: "حداقل یک روز کاری انتخاب کن." }, { status: 400 });
  }
  const hm = /^(\d{1,2}):(\d{2})$/;
  if (typeof hoursInput?.from !== "string" || !hm.test(hoursInput.from) ||
      typeof hoursInput?.to !== "string" || !hm.test(hoursInput.to)) {
    return NextResponse.json({ ok: false, error: "ساعت شروع/پایان نامعتبر است." }, { status: 400 });
  }
  const cleanHours = JSON.stringify({ days, from: hoursInput.from, to: hoursInput.to });

  await setAppSetting(SUPPORT_CHAT_KEYS.enabled, enabled ? "true" : "false", ctx.admin.id);
  await setAppSetting(SUPPORT_CHAT_KEYS.welcome, welcome, ctx.admin.id);
  await setAppSetting(SUPPORT_CHAT_KEYS.hours, cleanHours, ctx.admin.id);

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "livechat.settings.set",
    targetType: "app-setting",
    meta: { enabled, days, from: hoursInput.from, to: hoursInput.to },
  });

  return NextResponse.json({ ok: true });
}
