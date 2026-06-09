// ─────────────────────────────────────────────────────────────────────────────
// admin.ts — منطقِ نوشتنِ بلاگ از پنل (DECISION-065). فقط سرور.
// یکتاسازیِ slug/shortCode، محاسبهٔ زمانِ مطالعه، sync برچسب‌ها، مدیریتِ publishedAt.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { slugify, generateShortCode, calcReadingMinutes, makeExcerpt } from "./utils";

/** slug یکتا — اگر تکراری بود پسوندِ عددی اضافه می‌شود. excludeId برای ویرایش. */
export async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let n = 2;
  // حداکثر چند تلاش — در عمل تقریباً همیشه بارِ اول
  while (true) {
    const found = await prisma.blogPost.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!found) return candidate;
    candidate = `${root}-${n++}`;
  }
}

/** shortCode یکتا با retry. */
export async function ensureUniqueShortCode(): Promise<string> {
  while (true) {
    const code = generateShortCode();
    const found = await prisma.blogPost.findUnique({ where: { shortCode: code }, select: { id: true } });
    if (!found) return code;
  }
}

/** برچسب‌ها را upsert و رابطهٔ مقاله را دقیقاً با همین مجموعه sync می‌کند. */
export async function syncPostTags(postId: string, tagNames: string[]): Promise<void> {
  const clean = Array.from(
    new Set(tagNames.map((t) => t.trim()).filter(Boolean))
  ).slice(0, 12);

  const tagIds: string[] = [];
  for (const name of clean) {
    const slug = slugify(name);
    const tag = await prisma.blogTag.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
      select: { id: true },
    });
    tagIds.push(tag.id);
  }

  // حذفِ رابطه‌های قدیمی که دیگر نیستند، افزودنِ جدیدها
  await prisma.blogPostTag.deleteMany({
    where: { postId, ...(tagIds.length ? { tagId: { notIn: tagIds } } : {}) },
  });
  for (const tagId of tagIds) {
    await prisma.blogPostTag.upsert({
      where: { postId_tagId: { postId, tagId } },
      update: {},
      create: { postId, tagId },
    });
  }
}

export interface PostWriteInput {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  coverImage?: string | null;
  categoryId?: string | null;
  authorName?: string;
  status: string; // draft | published | archived
  isFeatured?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  tags?: string[];
}

/** publishedAt را بر اساس گذارِ وضعیت تعیین می‌کند. */
export function resolvePublishedAt(
  status: string,
  current: Date | null
): Date | null {
  if (status === "published") return current ?? getNow();
  return current; // draft/archived: تاریخِ قبلی حفظ می‌شود (یا null)
}
