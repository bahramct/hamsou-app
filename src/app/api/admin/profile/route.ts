// ─────────────────────────────────────────────────────────────────────────────
// /api/admin/profile — ویرایش پروفایل شخصی ادمینِ لاگین‌شده
// هر ادمین (فارغ از نقش) می‌تواند نام نمایشی، نام کاربری، تلفن و آواتار خود را تغییر دهد.
// تغییر رمز جدا از این است: POST /api/admin/auth/change-password.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

export async function PATCH(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });

  const data: Record<string, unknown> = {};

  if (typeof b.displayName === "string") {
    const dn = b.displayName.trim();
    if (!dn) return NextResponse.json({ error: "نام نمایشی نمی‌تواند خالی باشد." }, { status: 400 });
    data.displayName = dn;
  }

  if (typeof b.username === "string") {
    const u = b.username.trim();
    if (!USERNAME_RE.test(u)) {
      return NextResponse.json(
        { error: "نام کاربری باید ۳ تا ۳۲ کاراکتر و فقط شامل حروف لاتین، عدد، نقطه، خط تیره و زیرخط باشد." },
        { status: 400 }
      );
    }
    if (u !== ctx.admin.username) {
      const dup = await prisma.adminUser.findUnique({ where: { username: u }, select: { id: true } });
      if (dup && dup.id !== ctx.admin.id) {
        return NextResponse.json({ error: "این نام کاربری قبلاً استفاده شده." }, { status: 409 });
      }
      data.username = u;
    }
  }

  if (b.phone !== undefined) {
    const phone = typeof b.phone === "string" && b.phone.trim() ? b.phone.trim() : null;
    data.phone = phone;
  }

  // avatarImage — base64 JPEG فشرده‌شده از کراپ (DECISION-057)
  if ("avatarImage" in b) {
    const raw = b.avatarImage;
    if (raw === null || raw === undefined) {
      data.avatarImage = null;
    } else if (typeof raw === "string") {
      if (!raw.startsWith("data:image/")) {
        return NextResponse.json({ error: "فرمت تصویر معتبر نیست." }, { status: 400 });
      }
      if (raw.length > 250_000) {
        return NextResponse.json({ error: "حجم تصویر بیش از حد مجاز است." }, { status: 400 });
      }
      data.avatarImage = raw;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "تغییری ارسال نشد." }, { status: 400 });
  }

  await prisma.adminUser.update({ where: { id: ctx.admin.id }, data });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "admin.profile.update",
    targetType: "admin",
    targetId: ctx.admin.id,
    meta: { fields: Object.keys(data) },
  });

  return NextResponse.json({ ok: true });
}
