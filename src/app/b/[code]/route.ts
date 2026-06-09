// ─────────────────────────────────────────────────────────────────────────────
// GET /b/<code> — لینکِ کوتاهِ مقاله (DECISION-065)
// shortCode یکتا → redirect 308 به /blog/<slug>. اگر نبود → به فهرستِ بلاگ.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { code } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { shortCode: code, status: "published" },
    select: { slug: true },
  });

  const url = req.nextUrl.clone();
  url.pathname = post ? `/blog/${post.slug}` : "/blog";
  url.search = "";
  return NextResponse.redirect(url, 308);
}
