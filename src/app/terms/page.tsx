// ─────────────────────────────────────────────────────────────────────────────
// /terms — صفحهٔ عمومیِ قوانین و مقررات
// همان محتوای TermsModal؛ نمایشِ مستقل در صفحاتِ عمومی (بدون نیاز به ورود).
// ─────────────────────────────────────────────────────────────────────────────

import { CmsPageShell } from "@/components/cms/CmsPageShell";
import { TermsContent } from "@/components/features/terms/TermsContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "قوانین و مقررات — همسو",
  description: "شرایط استفاده، سلب مسئولیت و قوانین حاکم بر سرویس همسو.",
};

export default function TermsPage() {
  return (
    <CmsPageShell blobOpacity={0.4} blobCount={2}>
      <div className="min-h-[calc(100dvh-64px)] pt-24 pb-20 px-6 lg:px-10">
        <div className="max-w-2xl mx-auto">
          {/* ── هدر ── */}
          <div className="mb-10">
            <p className="text-[11px] text-fog uppercase tracking-[0.18em] mb-2" style={{ fontWeight: 600 }}>همسو</p>
            <h1 className="text-2xl font-semibold text-ink mb-3">قوانین و مقررات</h1>
            <p className="text-sm text-stone leading-relaxed">
              با استفاده از همسو، شرایط زیر را پذیرفته‌اید. لطفاً با دقت مطالعه کنید.
            </p>
            <p className="text-xs text-fog mt-2 fa-num">آخرین بروزرسانی: خرداد ۱۴۰۵</p>
          </div>

          <div className="h-px bg-black/6 mb-10" />

          {/* ── محتوا ── */}
          <TermsContent />
        </div>
      </div>
    </CmsPageShell>
  );
}
