// GET /api/admin/nav-counts — شمارِ badgeهای سایدبار پنل (تیکت باز + چت خوانده‌نشده)
// ?ts=<timestamp_ms>  → فقط تیکت‌های بعد از این زمان (آخرین بازدید ادمین)
// ?cs=<timestamp_ms>  → فقط چت‌های بعد از این زمان
// بدون پارامتر → همهٔ موارد باز (برای اولین بار / fallback).
// AdminShell این را با فاصلهٔ آرام poll می‌کند.

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { getSupportNavCounts } from "@/lib/support/nav-counts";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ ok: false }, { status: 401 });
  if (!can(ctx, "support.read")) {
    return NextResponse.json({ ok: true, openTickets: 0, unreadChats: 0 });
  }
  const ts = parseInt(req.nextUrl.searchParams.get("ts") ?? "0", 10);
  const cs = parseInt(req.nextUrl.searchParams.get("cs") ?? "0", 10);
  const counts = await getSupportNavCounts(ts || undefined, cs || undefined);
  return NextResponse.json({ ok: true, ...counts });
}
