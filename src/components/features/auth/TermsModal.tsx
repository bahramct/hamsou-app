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
          className="overflow-y-auto flex-1 px-6 py-5 text-[14px] text-stone leading-loose space-y-5"
          style={{ overscrollBehavior: "contain" }}
        >
          <Section num="۱" title="پذیرش شرایط">
            با ورود به همسو، این شرایط را می‌پذیرید. اگر با هر بخش از آن موافق نیستید،
            لطفاً از استفاده از سرویس خودداری کنید.
          </Section>

          <Section num="۲" title="معرفی سرویس">
            همسو یک ابزار شخصی برای خودآگاهی و توسعه فردی است. این سرویس امکان ثبت
            تعهد روزانه، دریافت بازتاب شخصی و مشاهده گزارش هفتگی را فراهم می‌کند.
            همسو جایگزین هیچ‌گونه مشاوره تخصصی نیست و صرفاً ابزاری برای خودبازبینی
            شخصی است.
          </Section>

          <Section num="۳" title="حساب کاربری و مسئولیت">
            شما مسئول حفظ امنیت اطلاعات ورود خود هستید. هرگونه فعالیت انجام‌شده از
            طریق حساب شما، مسئولیت آن بر عهدهٔ شماست. در صورت مشاهدهٔ دسترسی غیرمجاز،
            فوراً با ما تماس بگیرید.
          </Section>

          <Section num="۴" title="مالکیت محتوا">
            محتوایی که در همسو ثبت می‌کنید، متعلق به شماست. ما هیچ ادعایی بر مالکیت
            تعهدها، بازخوردها و یادداشت‌های شخصی شما نداریم. این اطلاعات صرفاً برای
            ارائه سرویس استفاده می‌شوند و هرگز به اشخاص ثالث منتقل نمی‌شوند.
          </Section>

          <Section num="۵" title="پرداخت و اشتراک">
            هزینه‌های پرداخت‌شده بازگشت‌پذیر نیستند، مگر در موارد خرابی سرویس از
            سمت ما. با خرید هر پلن، شرایط و محدودیت‌های آن پلن را می‌پذیرید. ما حق
            داریم قیمت‌ها را تغییر دهیم؛ این تغییرات برای اشتراک‌های فعال تا پایان
            دوره اعمال نخواهد شد.
          </Section>

          <Section num="۶" title="حریم خصوصی">
            اطلاعات شما نزد ما محفوظ است. ما هرگز اطلاعات شخصی شما را نمی‌فروشیم یا
            اجاره نمی‌دهیم. ارتباطات شما با سرویس رمزنگاری‌شده است. گزارش‌های هفتگی
            فقط در صورت انتخاب شخصی شما به‌اشتراک گذاشته می‌شوند.
          </Section>

          <Section num="۷" title="سلب مسئولیت محتوای هوش مصنوعی">
            گزارش‌ها و تحلیل‌های تولیدشده توسط هوش مصنوعی در همسو صرفاً جنبه
            بازتابی و اطلاعاتی دارند و به‌هیچ‌وجه جایگزین مشاوره تخصصی روانشناختی،
            پزشکی، مالی یا حقوقی نیستند. همسو مسئولیتی در قبال تصمیماتی که بر اساس
            این محتوا اتخاذ می‌شوند، ندارد.
          </Section>

          <Section num="۸" title="محدودیت‌های استفاده">
            استفاده از همسو برای اهداف غیرقانونی، آزاردهنده، یا با نیت آسیب رساندن
            به خود یا دیگران ممنوع است. ما حق داریم در صورت نقض این شرایط، بدون اطلاع
            قبلی دسترسی را محدود یا متوقف کنیم.
          </Section>

          <Section num="۹" title="تغییر شرایط">
            ما ممکن است این شرایط را در هر زمان تغییر دهیم. تغییرات مهم از طریق ایمیل
            یا اعلان در سرویس به اطلاع شما خواهد رسید. ادامه استفاده از سرویس پس از
            تغییرات، به معنای پذیرش شرایط جدید است.
          </Section>

          <Section num="۱۰" title="خاتمه و قانون حاکم">
            شما می‌توانید هر زمان درخواست حذف حساب خود را بدهید. این شرایط تابع
            قوانین جمهوری اسلامی ایران است و هرگونه اختلاف در چارچوب قوانین ایران
            حل‌وفصل خواهد شد.
          </Section>

          {/* آخرین خط — مشخص‌کنندهٔ انتها */}
          <p className="text-xs text-fog text-center pt-2 pb-1 fa-num">
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

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-1.5 fa-num">
        {num}. {title}
      </h3>
      <p className="leading-loose text-stone">{children}</p>
    </div>
  );
}
