// ─────────────────────────────────────────────────────────────────────────────
// OG image پویا برای /share/[id] (DECISION-052 · DECISION-054)
// همان «کارتِ فشردهٔ» ۱۲۰۰×۶۳۰ که در مودالِ اشتراک‌گذاری هم دانلود می‌شود — از
// بلوک‌های مشترکِ lib/reports/share-image (یک منبعِ حقیقت). وقتی لینک در
// توییتر/لینکدین/تلگرام paste شود، این کارت دیده می‌شود.
// runtime = nodejs (خواندن فایل فونت با fs).
// ─────────────────────────────────────────────────────────────────────────────

// OG image برای /share/[id] — BrandCard ساده (بدون متن فارسی پیچیده → Satori مشکل ندارد)
import { ImageResponse } from "next/og";
import { BrandCard, loadShareFonts, SHARE_SIZES } from "@/lib/reports/share-image";

export const runtime = "nodejs";
export const alt = "گزارش هفتگی همسو";
export const size = SHARE_SIZES.card;
export const contentType = "image/png";

export default async function OgImage() {
  const fonts = loadShareFonts();
  return new ImageResponse(<BrandCard width={size.width} height={size.height} />, { ...size, fonts });
}
