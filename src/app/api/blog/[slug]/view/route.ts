// ─────────────────────────────────────────────────────────────────────────────
// POST /api/blog/<slug>/view — افزایشِ شمارندهٔ بازدید (DECISION-065)
// از یک beaconِ سمتِ کلاینت پس از mountِ صفحهٔ مقاله صدا زده می‌شود (نه RSC) تا
// با caching تداخل نکند و رباتِ prefetch بازدید کاذب نسازد.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params;
  try {
    await prisma.blogPost.updateMany({
      where: { slug, status: "published" },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    // بی‌صدا — بازدید حیاتی نیست
  }
  return NextResponse.json({ ok: true });
}
