// ─────────────────────────────────────────────────────────────────────────────
// POST /api/blog/<slug>/comments — ثبتِ کامنتِ عمومی (DECISION-065)
// هر کسی (حتی غیرکاربر) با نام+ایمیل+متن. وضعیتِ اولیه pending — فقط پس از تأییدِ
// ادمین در سایت نمایش داده می‌شود. ایمیل خصوصی است. honeypot ساده ضدِ ربات.
// «اعلان پنل»: کامنتِ جدید در شمارِ nav-counts پنل ظاهر می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { COMMENT_MAX_LEN, COMMENT_NAME_MAX_LEN } from "@/lib/blog/constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const b = (body ?? {}) as Record<string, unknown>;

  // honeypot — فیلدِ مخفیِ website اگر پر باشد یعنی ربات. بی‌صدا «موفق».
  if (typeof b.website === "string" && b.website.trim()) {
    return NextResponse.json({ ok: true, pending: true });
  }

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const text = typeof b.body === "string" ? b.body.trim() : "";
  const parentId = typeof b.parentId === "string" && b.parentId ? b.parentId : null;

  if (!name || name.length > COMMENT_NAME_MAX_LEN)
    return NextResponse.json({ error: "نام را درست وارد کن." }, { status: 400 });
  if (!EMAIL_RE.test(email))
    return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
  if (!text || text.length > COMMENT_MAX_LEN)
    return NextResponse.json({ error: "متنِ کامنت را درست وارد کن." }, { status: 400 });

  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "published" },
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: "مقاله یافت نشد." }, { status: 404 });

  // پاسخ فقط به کامنتِ تأییدشدهٔ همین مقاله مجاز است (یک‌سطح: parent خودش ریشه باشد)
  if (parentId) {
    const parent = await prisma.blogComment.findFirst({
      where: { id: parentId, postId: post.id, status: "approved" },
      select: { parentId: true },
    });
    if (!parent) return NextResponse.json({ error: "کامنتِ مرجع نامعتبر است." }, { status: 400 });
  }

  const created = await prisma.blogComment.create({
    data: {
      postId: post.id,
      parentId,
      authorName: name,
      authorEmail: email,
      body: text,
      status: "pending",
    },
    select: { id: true, authorName: true, body: true, parentId: true, createdAt: true },
  });

  return NextResponse.json({
    ok: true,
    pending: true,
    message: "کامنتت ثبت شد و پس از تأیید نمایش داده می‌شود.",
    // برای نمایشِ gray-out نزدِ خودِ نویسنده تا تأیید ادمین
    comment: {
      id: created.id,
      authorName: created.authorName,
      body: created.body,
      parentId: created.parentId,
      createdAtIso: created.createdAt.toISOString(),
    },
  });
}
