// ─────────────────────────────────────────────────────────────────────────────
// /api/profile
//
// GET   — اطلاعات کامل پروفایل کاربر جاری
// PATCH — ویرایش هر ترکیبی از: displayName، bio، companionName، avatarPreset
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true,
      phone: true,
      displayName: true,
      bio: true,
      companionName: true,
      avatarPreset: true,
      avatarImage: true,
      plan: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    profile: {
      id: dbUser.id,
      phone: dbUser.phone,
      displayName: dbUser.displayName,
      bio: dbUser.bio,
      companionName: dbUser.companionName,
      avatarPreset: dbUser.avatarPreset,
      avatarImage: dbUser.avatarImage,
      plan: dbUser.plan,
      memberSince: dbUser.createdAt.toISOString(),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const data: {
    displayName?: string | null;
    bio?: string | null;
    companionName?: string | null;
    avatarImage?: string | null;
  } = {};

  // displayName
  if ("displayName" in body) {
    const raw = body.displayName;
    const val =
      raw === null || raw === undefined ? null : typeof raw === "string" ? raw.trim() : null;
    if (val !== null && val.length > 50) {
      return NextResponse.json(
        { ok: false, error: "display_name_too_long", message: "نام نمایشی حداکثر ۵۰ کاراکتر" },
        { status: 422 }
      );
    }
    data.displayName = val;
  }

  // bio
  if ("bio" in body) {
    const raw = body.bio;
    const val =
      raw === null || raw === undefined ? null : typeof raw === "string" ? raw.trim() : null;
    if (val !== null && val.length > 200) {
      return NextResponse.json(
        { ok: false, error: "bio_too_long", message: "بیوگرافی حداکثر ۲۰۰ کاراکتر" },
        { status: 422 }
      );
    }
    data.bio = val;
  }

  // companionName
  if ("companionName" in body) {
    const raw = body.companionName;
    const val =
      raw === null || raw === undefined ? null : typeof raw === "string" ? raw.trim() : null;
    if (val !== null && val.length > 30) {
      return NextResponse.json(
        { ok: false, error: "companion_name_too_long", message: "نام همدم حداکثر ۳۰ کاراکتر" },
        { status: 422 }
      );
    }
    data.companionName = val || null;
  }

  // avatarImage — base64 JPEG فشرده‌شده از کراپ (DECISION-057)
  if ("avatarImage" in body) {
    const raw = body.avatarImage;
    if (raw === null || raw === undefined) {
      data.avatarImage = null;
    } else if (typeof raw === "string") {
      if (!raw.startsWith("data:image/")) {
        return NextResponse.json(
          { ok: false, error: "invalid_image", message: "فرمت تصویر معتبر نیست" },
          { status: 422 }
        );
      }
      if (raw.length > 250_000) {
        return NextResponse.json(
          { ok: false, error: "image_too_large", message: "حجم تصویر بیش از حد مجاز است" },
          { status: 422 }
        );
      }
      data.avatarImage = raw;
    } else {
      return NextResponse.json(
        { ok: false, error: "invalid_image_type", message: "نوع داده تصویر نامعتبر است" },
        { status: 422 }
      );
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "no_fields", message: "هیچ فیلدی ارسال نشد" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.userId },
    data,
    select: {
      displayName: true,
      bio: true,
      companionName: true,
      avatarPreset: true,
    },
  });

  return NextResponse.json({ ok: true, ...updated });
}
