import type { Metadata } from "next";
import Link from "next/link";
import { LandingEffects } from "@/components/features/landing/LandingEffects";
import { LandingNav } from "@/components/layout/LandingNav";
import { LandingFooter } from "@/components/layout/LandingFooter";

export const metadata: Metadata = {
  title: "حریم خصوصی — همسو",
  description: "همسو متعهد است داده‌های شما را با حداکثر مراقبت و احترام نگه‌داری کند.",
};

const sections = [
  { id: "commitment", title: "تعهد ما به حریم خصوصی شما" },
  { id: "data-collected", title: "چه داده‌ای جمع‌آوری می‌کنیم؟" },
  { id: "data-use", title: "از داده‌های شما چطور استفاده می‌کنیم؟" },
  { id: "data-sharing", title: "داده‌ها را با چه کسی به اشتراک می‌گذاریم؟" },
  { id: "security", title: "امنیت داده‌ها" },
  { id: "rights", title: "حقوق شما" },
  { id: "contact", title: "تماس برای موارد حریم خصوصی" },
];

export default function PrivacyPage() {
  return (
    <main className="grain">
      <LandingEffects />

      <div className="bg-stage" style={{ opacity: 0.45 }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>

      <LandingNav />

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 pt-36 pb-16 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto">

          <div className="anim-fade-up d-1 mb-8 flex items-center gap-2" style={{ fontWeight: 300, fontSize: "14px" }}>
            <Link href="/" className="text-fog hover:text-stone transition-colors">همسو</Link>
            <span className="text-fog" style={{ opacity: 0.5 }}>›</span>
            <span className="text-stone">حریم خصوصی</span>
          </div>

          <div className="anim-fade-up d-2 mb-8">
            <span className="pill"><span className="pill-dot" />آخرین به‌روزرسانی: ۲۰ خرداد ۱۴۰۵</span>
          </div>

          <h1
            className="anim-fade-up d-3"
            style={{
              fontWeight: 100,
              fontSize: "clamp(38px, 5.5vw, 68px)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              color: "var(--color-ink)",
            }}
          >
            حریم خصوصی{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--color-sage-deep)" }}>
              شما مهم است.
            </em>
          </h1>

          <p
            className="anim-fade-up d-4 mt-6 text-stone"
            style={{ fontWeight: 300, fontSize: "18px", lineHeight: 1.85, maxWidth: "560px" }}
          >
            داده‌هایی که با همسو به اشتراک می‌گذارید — تعهداتت، بازخوردهایت —
            شخصی‌ترین بخش‌های زندگی توست. ما این را می‌دانیم.
          </p>
        </div>
      </section>

      <hr className="hr-line mx-6 lg:mx-10 relative z-10" />

      {/* ══════════════════════════════════════════════════════════════════════
          محتوا — دو ستون روی دسکتاپ
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

            {/* فهرست مطالب — sticky روی دسکتاپ */}
            <aside className="lg:w-56 shrink-0">
              <div
                className="lg:sticky"
                style={{ top: "5.5rem" }}
              >
                <div
                  className="text-fog text-xs uppercase tracking-[0.18em] mb-4"
                  style={{ fontWeight: 600 }}
                >
                  فهرست
                </div>
                <nav className="space-y-1">
                  {sections.map((s, i) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="flex items-center gap-3 py-2 group"
                      style={{ textDecoration: "none" }}
                    >
                      <span
                        className="shrink-0"
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "6px",
                          background: "rgba(122,132,113,0.08)",
                          border: "1px solid rgba(122,132,113,0.14)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          color: "var(--color-sage)",
                          fontWeight: 400,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="text-stone group-hover:text-ink transition-colors"
                        style={{ fontWeight: 300, fontSize: "13px", lineHeight: 1.5 }}
                      >
                        {s.title}
                      </span>
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* محتوای اصلی */}
            <div className="flex-1 min-w-0 space-y-16">

              {/* §۱ */}
              <div id="commitment" className="reveal scroll-mt-24">
                <SectionHeading num="۱" title="تعهد ما به حریم خصوصی شما" />
                <div className="prose-hamsoo">
                  <p>
                    همسو یک محیط شخصی است — جایی که تعهدات روزانه، بازخوردها و مسیر رشد شما ثبت می‌شود.
                    ما معتقدیم این داده‌ها باید کاملاً در کنترل شما باشند.
                  </p>
                  <p>
                    ما داده‌های شما را نمی‌فروشیم، نمی‌اجاریم، و برای هیچ هدف تبلیغاتی استفاده نمی‌کنیم.
                    سیاست حریم خصوصی ما ساده است: داده‌های شما، برای ارائه خدماتی که خواسته‌اید — نه بیشتر.
                  </p>
                </div>
              </div>

              {/* §۲ */}
              <div id="data-collected" className="reveal scroll-mt-24">
                <SectionHeading num="۲" title="چه داده‌ای جمع‌آوری می‌کنیم؟" />
                <div className="prose-hamsoo">
                  <p>برای ارائه خدمات همسو، اطلاعات زیر ممکن است ذخیره شوند:</p>
                  <DataTable items={[
                    { label: "شناسه ورود", value: "شماره موبایل (ایران) یا آدرس ایمیل" },
                    { label: "نام نمایشی", value: "اختیاری — اگر تنظیم کنید" },
                    { label: "تعهدات روزانه", value: "متن تعهدی که هر روز ثبت می‌کنید" },
                    { label: "بازخوردها", value: "وضعیت (انجام شد / نشد) + یادداشت اختیاری" },
                    { label: "گزارش‌های هفتگی", value: "خروجی تحلیل هوش مصنوعی بر اساس داده‌های شما" },
                    { label: "اطلاعات فنی", value: "نوع مرورگر، IP (برای امنیت) — بدون ردیابی رفتاری" },
                  ]} />
                  <p>
                    ما هیچ‌گاه موقعیت جغرافیایی دقیق، مخاطبین، یا داده‌های حساس دیگری جمع‌آوری نمی‌کنیم.
                  </p>
                </div>
              </div>

              {/* §۳ */}
              <div id="data-use" className="reveal scroll-mt-24">
                <SectionHeading num="۳" title="از داده‌های شما چطور استفاده می‌کنیم؟" />
                <div className="prose-hamsoo">
                  <p>داده‌های شما فقط برای اهداف زیر استفاده می‌شوند:</p>
                  <ul>
                    <li>ارائه خدمات اصلی همسو (ثبت تعهد، بازخورد، گزارش هفتگی)</li>
                    <li>تولید گزارش هفتگی با کمک هوش مصنوعی — بدون ذخیره محتوای تعهدات در سرورهای AI</li>
                    <li>احراز هویت و امنیت حساب کاربری</li>
                    <li>بهبود کیفیت محصول بر اساس داده‌های جمعی و ناشناس (بدون شناسایی شما)</li>
                  </ul>
                  <Note>
                    گزارش هفتگی توسط هوش مصنوعی تولید می‌شود. در این فرآیند، متن تعهدات به صورت ناشناس (بدون نام یا شناسه) پردازش می‌شود و در سرورهای ارائه‌دهنده AI ذخیره نمی‌ماند.
                  </Note>
                </div>
              </div>

              {/* §۴ */}
              <div id="data-sharing" className="reveal scroll-mt-24">
                <SectionHeading num="۴" title="داده‌ها را با چه کسی به اشتراک می‌گذاریم؟" />
                <div className="prose-hamsoo">
                  <p
                    style={{
                      fontWeight: 300,
                      fontSize: "18px",
                      color: "var(--color-sage-deep)",
                      borderRight: "3px solid var(--color-sage)",
                      paddingRight: "1rem",
                      lineHeight: 1.7,
                    }}
                  >
                    ما داده‌های شما را با هیچ شخص یا شرکت ثالثی به اشتراک نمی‌گذاریم.
                  </p>
                  <p>استثناهای محدود:</p>
                  <ul>
                    <li>
                      <strong>ارائه‌دهندگان زیرساخت:</strong> سرویس‌های هاست و ایمیل که برای اجرای همسو ضروری‌اند — و همگی تابع قراردادهای حفاظت از داده هستند.
                    </li>
                    <li>
                      <strong>الزامات قانونی:</strong> در صورت وجود حکم قضایی قانونی — با اطلاع شما در صورت امکان.
                    </li>
                  </ul>
                  <p>
                    اگر در آینده تغییری در این سیاست ایجاد شود، قبل از اجرا به صورت واضح به شما اطلاع خواهیم داد.
                  </p>
                </div>
              </div>

              {/* §۵ */}
              <div id="security" className="reveal scroll-mt-24">
                <SectionHeading num="۵" title="امنیت داده‌ها" />
                <div className="prose-hamsoo">
                  <p>ما اقدامات فنی و سازمانی زیر را برای حفاظت از داده‌های شما اجرا می‌کنیم:</p>
                  <ul>
                    <li>رمزنگاری HTTPS برای تمام ارتباطات</li>
                    <li>رمزنگاری رمز عبور با الگوریتم‌های یک‌طرفه (bcrypt)</li>
                    <li>کدهای OTP با زمان انقضای کوتاه</li>
                    <li>دسترسی محدود به داده‌ها برای تیم توسعه</li>
                    <li>نسخه‌گیری منظم از پایگاه داده</li>
                  </ul>
                  <p>
                    هیچ سیستمی ۱۰۰٪ امن نیست. اگر مشکل امنیتی پیدا کردید، لطفاً فوری به
                    {" "}<a href="mailto:hello@hamsouapp.ir" style={{ color: "var(--color-sage-deep)" }}>hello@hamsouapp.ir</a>{" "}
                    اطلاع دهید.
                  </p>
                </div>
              </div>

              {/* §۶ */}
              <div id="rights" className="reveal scroll-mt-24">
                <SectionHeading num="۶" title="حقوق شما" />
                <div className="prose-hamsoo">
                  <p>شما در هر زمان می‌توانید:</p>
                  <DataTable items={[
                    { label: "حذف حساب", value: "از بخش تنظیمات — تمام داده‌ها پاک می‌شوند" },
                    { label: "ویرایش اطلاعات", value: "نام، ایمیل، شماره موبایل از پروفایل" },
                    { label: "دانلود داده‌ها", value: "با درخواست از hello@hamsouapp.ir — در قالب JSON" },
                    { label: "لغو اشتراک اطلاعیه‌ها", value: "از بخش تنظیمات حساب" },
                  ]} />
                  <p>
                    بر اساس قوانین جمهوری اسلامی ایران و اصول حفاظت از داده، ما پاسخگوی
                    درخواست‌های مرتبط با داده‌های شخصی شما هستیم.
                  </p>
                </div>
              </div>

              {/* §۷ */}
              <div id="contact" className="reveal scroll-mt-24">
                <SectionHeading num="۷" title="تماس برای موارد حریم خصوصی" />
                <div className="prose-hamsoo">
                  <p>
                    اگر سوال، نگرانی یا درخواستی درباره حریم خصوصی دارید، با ما تماس بگیرید:
                  </p>
                  <div
                    className="mt-4 p-5 rounded-2xl flex items-center gap-4"
                    style={{ background: "rgba(122,132,113,0.06)", border: "1px solid rgba(122,132,113,0.12)" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage-deep)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <a
                      href="mailto:hello@hamsouapp.ir"
                      style={{ fontWeight: 300, fontSize: "16px", color: "var(--color-ink)", direction: "ltr" }}
                    >
                      hello@hamsouapp.ir
                    </a>
                  </div>
                  <p className="mt-4">
                    ما متعهدیم ظرف ۷۲ ساعت به درخواست‌های حریم خصوصی پاسخ دهیم.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 pb-8" />
      <LandingFooter />
    </main>
  );
}

/* ── کامپوننت‌های کمکی داخلی ── */

function SectionHeading({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          background: "rgba(122,132,113,0.09)",
          border: "1px solid rgba(122,132,113,0.16)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "13px",
          color: "var(--color-sage-deep)",
          fontWeight: 400,
          flexShrink: 0,
        }}
      >
        {num}
      </span>
      <h2
        style={{
          fontWeight: 300,
          fontSize: "clamp(18px, 2vw, 24px)",
          color: "var(--color-ink)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function DataTable({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="rounded-2xl overflow-hidden my-5" style={{ border: "1px solid rgba(26,26,31,0.08)" }}>
      {items.map((item, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row gap-1 sm:gap-4 px-5 py-3.5"
          style={{
            borderTop: i > 0 ? "1px solid rgba(26,26,31,0.06)" : undefined,
            background: i % 2 === 0 ? "rgba(255,255,255,0.55)" : "rgba(245,242,235,0.5)",
          }}
        >
          <span
            className="shrink-0"
            style={{ fontWeight: 400, fontSize: "14px", color: "var(--color-ink)", minWidth: "140px" }}
          >
            {item.label}
          </span>
          <span style={{ fontWeight: 300, fontSize: "14px", color: "var(--color-stone)", lineHeight: 1.6 }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-3 p-4 rounded-xl my-4"
      style={{ background: "rgba(193,154,74,0.07)", border: "1px solid rgba(193,154,74,0.16)" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{ fontWeight: 300, fontSize: "14px", color: "var(--color-stone)", lineHeight: 1.75, margin: 0 }}>
        {children}
      </p>
    </div>
  );
}
