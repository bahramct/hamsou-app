// ─────────────────────────────────────────────────────────────────────────────
// POST /api/blog/<slug>/like — لایک/برداشتنِ لایک (DECISION-065)
// کاربر لاگین نیست → یکتایی با fingerprint = hash(IP + UA). idempotent toggle:
//   اگر قبلاً لایک شده → حذف و کاهش؛ وگرنه → افزودن و افزایش. اتمیک با transaction.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { visitorFingerprint, getRequestIp } from "@/lib/blog/utils";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;

  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "published" },
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: "مقاله یافت نشد." }, { status: 404 });

  const ip = getRequestIp(req.headers);
  const ua = req.headers.get("user-agent") ?? "";
  const fp = visitorFingerprint(ip, ua);

  const existing = await prisma.blogLike.findUnique({
    where: { postId_fingerprint: { postId: post.id, fingerprint: fp } },
    select: { id: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.blogLike.delete({ where: { id: existing.id } });
      const p = await tx.blogPost.update({
        where: { id: post.id },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      });
      return { liked: false, likeCount: Math.max(0, p.likeCount) };
    }
    await tx.blogLike.create({ data: { postId: post.id, fingerprint: fp } });
    const p = await tx.blogPost.update({
      where: { id: post.id },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });
    return { liked: true, likeCount: p.likeCount };
  });

  return NextResponse.json({ ok: true, ...result });
}

// GET — وضعیتِ لایکِ فعلیِ این بازدیدکننده (برای مقداردهیِ اولیهٔ دکمه).
export async function GET(req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "published" },
    select: { id: true, likeCount: true },
  });
  if (!post) return NextResponse.json({ error: "مقاله یافت نشد." }, { status: 404 });

  const fp = visitorFingerprint(getRequestIp(req.headers), req.headers.get("user-agent") ?? "");
  const existing = await prisma.blogLike.findUnique({
    where: { postId_fingerprint: { postId: post.id, fingerprint: fp } },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, liked: Boolean(existing), likeCount: post.likeCount });
}
