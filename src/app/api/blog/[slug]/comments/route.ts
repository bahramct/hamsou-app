// ─────────────────────────────────────────────────────────────────────────────
// POST /api/blog/<slug>/comments — ثبتِ کامنت (DECISION-079؛ بازنگریِ DECISION-065)
// فقط کاربرانِ عضو (لاگین‌کرده) می‌توانند کامنت بگذارند. هویت از session می‌آید —
// نه از بدنهٔ درخواست. اگر کاربر عضو/لاگین نباشد → 401 با پیام دعوت به عضویت.
// وضعیتِ اولیه pending — فقط پس از تأییدِ ادمین در سایت دیده می‌شود.
// نام نمایشی = displayName کاربر؛ ایمیل/موبایل خصوصی (فقط ادمین). honeypot ساده.
// «اعلان پنل»: کامنتِ جدید در شمارِ nav-counts پنل ظاهر می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { COMMENT_MAX_LEN } from "@/lib/blog/constants";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;

  // گیتِ عضویت — فقط کاربرِ لاگین‌کرده (DECISION-079)
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { error: "برای ثبت نظر باید عضو همسو شوی.", requireAuth: true },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const b = (body ?? {}) as Record<string, unknown>;

  // honeypot — فیلدِ مخفیِ website اگر پر باشد یعنی ربات. بی‌صدا «موفق».
  if (typeof b.website === "string" && b.website.trim()) {
    return NextResponse.json({ ok: true, pending: true });
  }

  const text = typeof b.body === "string" ? b.body.trim() : "";
  const parentId = typeof b.parentId === "string" && b.parentId ? b.parentId : null;

  if (!text || text.length > COMMENT_MAX_LEN)
    return NextResponse.json({ error: "متنِ کامنت را درست وارد کن." }, { status: 400 });

  // هویتِ نویسنده از حساب (نه از بدنهٔ درخواست)
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { displayName: true, username: true, email: true, phone: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: "برای ثبت نظر باید عضو همسو شوی.", requireAuth: true },
      { status: 401 }
    );
  }

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

  // نامِ نمایشی: displayName کاربر (نام‌کاربری/ایمیل/موبایل هرگز نمایش داده نمی‌شوند).
  const displayName = user.displayName?.trim() || "عضو همسو";
  // ردِ پای خصوصی برای پنل: ایمیل اگر بود، وگرنه موبایل (فقط ادمین می‌بیند).
  const privateContact = user.email?.trim() || user.phone?.trim() || "";

  const created = await prisma.blogComment.create({
    data: {
      postId: post.id,
      parentId,
      authorUserId: session.userId,
      authorName: displayName,
      authorEmail: privateContact,
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
