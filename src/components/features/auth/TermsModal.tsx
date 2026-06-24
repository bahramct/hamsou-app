"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TermsModal — مودال شرایط استفاده + سلب مسئولیت
//
// رفتار: کاربر باید تا انتهای متن اسکرول کند؛ تنها پس از آن دکمه فعال می‌شود.
// کلیک روی پس‌زمینه و Escape غیرفعال هستند (اجباری‌خواندن).
// پس از کلیک دکمه، `onAccept` صدا زده می‌شود و مودال بسته می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { TermsContent } from "@/components/features/terms/TermsContent";

interface Props {
  isOpen: boolean;
  onAccept: () => void;
}

export function TermsModal({ isOpen, onAccept }: Props) {
  const [hasReadAll, setHasReadAll] = useState(false);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // هر بار که مودال باز می‌شود، وضعیت اسکرول ریست شود
  useEffect(() => {
    if (isOpen) {
      setHasReadAll(false);
      setTimeout(() => contentRef.current?.scrollTo({ top: 0 }), 50);
    }
  }, [isOpen]);

  // قفل اسکرول صفحه
  useEffect(() => {
    if (!isOpen) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [isOpen]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    if (hasReadAll) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 30) {
      setHasReadAll(true);
    }
  }

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(15,14,12,0.82)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      aria-modal="true"
      role="dialog"
      aria-label="شرایط استفاده از همسو"
    >
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col shadow-[0_32px_72px_rgba(46,44,40,0.48)]"
        style={{ maxHeight: "calc(100dvh - 48px)", background: "var(--color-paper)", border: "1px solid rgba(26,26,31,0.10)" }}
      >
        {/* ── هدر ثابت ── */}
        <div className="px-6 pt-6 pb-4 border-b border-black/6 shrink-0">
          <p className="text-[10px] text-fog uppercase tracking-widest mb-1">همسو</p>
          <h2 className="text-[17px] font-semibold text-ink">شرایط استفاده و سلب مسئولیت</h2>
          <p className="text-xs text-stone mt-1.5 leading-relaxed">
            برای ادامه، لطفاً تا انتها مطالعه کنید.
          </p>
        </div>

        {/* ── محتوای اسکرول‌پذیر ── */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="overflow-y-auto flex-1 px-6 py-5"
          style={{ overscrollBehavior: "contain" }}
        >
          <TermsContent />
          {/* آخرین خط — مشخص‌کنندهٔ انتها برای تشخیص scroll به پایین */}
          <p className="text-xs text-fog text-center pt-4 pb-1 fa-num">
            آخرین بروزرسانی: خرداد ۱۴۰۵
          </p>
        </div>

        {/* ── فوتر ثابت ── */}
        <div className="px-6 py-4 border-t border-black/6 shrink-0">
          {!hasReadAll && (
            <p className="text-[11px] text-fog text-center mb-3 leading-relaxed">
              برای فعال شدن دکمه، تا انتهای متن اسکرول کنید.
            </p>
          )}
          <button
            type="button"
            onClick={onAccept}
            disabled={!hasReadAll}
            className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium
              transition-all duration-350
              disabled:opacity-30 disabled:cursor-not-allowed
              hover:bg-charcoal active:scale-[0.98]"
          >
            قوانین را مطالعه کردم
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

