import type { Metadata } from "next";
import Link from "next/link";
import { LandingEffects } from "@/components/features/landing/LandingEffects";
import { LandingNav } from "@/components/layout/LandingNav";
import { LandingFooter } from "@/components/layout/LandingFooter";

export const metadata: Metadata = {
  title: "درباره ما — همسو",
  description: "همسو از یک سوال ساخته شد: چرا فاصله‌ای بین آنچه می‌گوییم و آنچه می‌کنیم هست؟",
};

const notItems = [
  "Task Manager یا ابزار مدیریت پروژه",
  "Habit Tracker با استریک، امتیاز یا مدال",
  "اپلیکیشن انگیزشی با پیام‌های مصنوعی",
  "سیستم رقابت یا مقایسه با دیگران",
  "محیطی که کاربر را به خودش وابسته کند",
];

export default function AboutPage() {
  return (
    <main className="grain">
      <LandingEffects />

      {/* پس‌زمینه — بلوب‌های ambient، آرام‌تر از لندینگ */}
      <div className="bg-stage" style={{ opacity: 0.6 }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <LandingNav />

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 pt-36 pb-20 px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">

          {/* breadcrumb */}
          <div className="anim-fade-up d-1 mb-8 flex items-center gap-2" style={{ fontWeight: 300, fontSize: "14px" }}>
            <Link href="/" className="text-fog hover:text-stone transition-colors">همسو</Link>
            <span className="text-fog" style={{ opacity: 0.5 }}>›</span>
            <span className="text-stone">درباره ما</span>
          </div>

          <div className="anim-fade-up d-2 mb-8">
            <span className="pill"><span className="pill-dot" />ماهیت</span>
          </div>

          <h1
            className="anim-fade-up d-3"
            style={{
              fontWeight: 100,
              fontSize: "clamp(40px, 6vw, 80px)",
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              color: "var(--color-ink)",
            }}
          >
            از یک سوال{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--color-sage-deep)" }}>
              ساخته شد.
            </em>
          </h1>

          <p
            className="anim-fade-up d-4 mt-6 text-stone"
            style={{ fontWeight: 300, fontSize: "20px", lineHeight: 1.8, maxWidth: "580px" }}
          >
            چرا فاصله‌ای بین آنچه می‌گوییم و آنچه می‌کنیم هست؟
          </p>
        </div>
      </section>

      <hr className="hr-line mx-6 lg:mx-10 relative z-10" />

      {/* ══════════════════════════════════════════════════════════════════════
          تیزر صفحه داستان
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-14 px-6 lg:px-10">
        <div className="max-w-4xl mx-auto reveal">
          <div
            className="rounded-2xl p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            style={{
              background: "rgba(122,132,113,0.05)",
              border: "1px solid rgba(122,132,113,0.11)",
            }}
          >
            <div>
              <p
                className="mb-1"
                style={{ fontWeight: 300, fontSize: "16px", color: "var(--color-ink)" }}
              >
                از کجا آمد این ایده؟
              </p>
              <p
                className="text-stone"
                style={{ fontWeight: 300, fontSize: "14px", lineHeight: 1.75 }}
              >
                روایتِ کامل شکل‌گیری همسو — یک داستانِ واقعی از یک لحظه‌ی صادقانه.
              </p>
            </div>
            <Link
              href="/story"
              className="btn btn-ghost shrink-0"
              style={{ fontSize: "14px" }}
            >
              بخوان
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: "scaleX(-1)" }}
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          چرا همسو؟
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-24 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto">
          <div className="reveal mb-12">
            <div
              className="text-fog text-xs uppercase tracking-[0.18em] mb-6"
              style={{ fontWeight: 600 }}
            >
              چرا همسو؟
            </div>
          </div>

          <div className="space-y-8 reveal">
            <p style={{ fontWeight: 100, fontSize: "clamp(22px, 2.8vw, 32px)", lineHeight: 1.7, color: "var(--color-ink)", letterSpacing: "-0.01em" }}>
              هر روز کلمات زیادی می‌گوییم.
              <br />
              تصمیم می‌گیریم. نیت می‌کنیم.
            </p>
            <p className="text-stone" style={{ fontWeight: 300, fontSize: "18px", lineHeight: 2 }}>
              اما بین آنچه می‌گوییم و آنچه واقعاً انجام می‌دهیم، فاصله‌ای هست.
              نه از بی‌اراده‌گی —
            </p>
            <p className="text-stone" style={{ fontWeight: 300, fontSize: "18px", lineHeight: 2 }}>
              بلکه چون هیچ آینه‌ای نداشتیم که این فاصله را صادقانه، بدون قضاوت،
              و بدون فشار به ما نشان دهد.
            </p>
            <p
              style={{
                fontWeight: 300,
                fontSize: "22px",
                lineHeight: 1.6,
                color: "var(--color-sage-deep)",
                borderRight: "3px solid var(--color-sage)",
                paddingRight: "1.25rem",
              }}
            >
              همسو آن آینه است.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          سه اصل بنیادین
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative z-10 py-24 px-6 lg:px-10"
        style={{ background: "rgba(234,228,214,0.28)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div
              className="text-fog text-xs uppercase tracking-[0.18em] mb-5"
              style={{ fontWeight: 600 }}
            >
              اصول بنیادین
            </div>
            <h2
              style={{
                fontWeight: 100,
                fontSize: "clamp(28px, 3.5vw, 52px)",
                letterSpacing: "-0.02em",
                color: "var(--color-ink)",
              }}
            >
              سه چیزی که هرگز تغییر نمی‌کنند
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* ۱ — بدون قضاوت */}
            <div className="glass-strong rounded-3xl p-8 reveal hover-rise">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "rgba(122,132,113,0.10)", border: "1px solid rgba(122,132,113,0.20)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage-deep)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 className="mb-3" style={{ fontWeight: 400, fontSize: "18px", color: "var(--color-ink)" }}>
                بدون قضاوت
              </h3>
              <p className="text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.9 }}>
                همسو نه تشویق می‌کند نه سرزنش. روزهایی که تعهدت را انجام ندادی، داده است — نه شکست.
                فاصله‌ها هم بخشی از مسیرند.
              </p>
            </div>

            {/* ۲ — استقلال واقعی */}
            <div className="glass-strong rounded-3xl p-8 reveal hover-rise">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "rgba(155,180,199,0.10)", border: "1px solid rgba(155,180,199,0.22)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-mist)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <h3 className="mb-3" style={{ fontWeight: 400, fontSize: "18px", color: "var(--color-ink)" }}>
                استقلال واقعی
              </h3>
              <p className="text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.9 }}>
                داده‌های تو، مال تو. هیچ الگوریتمی تصمیم‌هایت را هدایت نمی‌کند.
                همسو ابزار است — نه مرشد.
              </p>
            </div>

            {/* ۳ — سادگی واقعی */}
            <div className="glass-strong rounded-3xl p-8 reveal hover-rise">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "rgba(193,154,74,0.08)", border: "1px solid rgba(193,154,74,0.20)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                  <line x1="16" y1="8" x2="2" y2="22" />
                  <line x1="17.5" y1="15" x2="9" y2="15" />
                </svg>
              </div>
              <h3 className="mb-3" style={{ fontWeight: 400, fontSize: "18px", color: "var(--color-ink)" }}>
                سادگی واقعی
              </h3>
              <p className="text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.9 }}>
                یک تعهد. یک پرسش. یک گزارش. هرچیزی که انرژی‌ات را بگیرد به جای اینکه بدهد،
                در همسو نیست.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          همسو چه نیست
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-24 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto">
          <div className="reveal mb-14">
            <div
              className="text-fog text-xs uppercase tracking-[0.18em] mb-5"
              style={{ fontWeight: 600 }}
            >
              خط قرمز
            </div>
            <h2
              style={{
                fontWeight: 100,
                fontSize: "clamp(28px, 3.5vw, 52px)",
                letterSpacing: "-0.02em",
                color: "var(--color-ink)",
              }}
            >
              همسو هرگز این نمی‌شود
            </h2>
          </div>

          <div className="space-y-3">
            {notItems.map((item, i) => (
              <div
                key={i}
                className="reveal flex items-center gap-4 p-5 rounded-2xl"
                style={{
                  background: "rgba(199,93,60,0.035)",
                  border: "1px solid rgba(199,93,60,0.08)",
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(199,93,60,0.07)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-ember)" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <span className="text-stone" style={{ fontWeight: 300, fontSize: "16px" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          مانیفست
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative z-10 py-28 px-6 lg:px-10 overflow-hidden"
        style={{ background: "rgba(92,101,85,0.04)" }}
      >
        {/* دکوراسیون پس‌زمینه */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(122,132,113,0.06), transparent)",
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center reveal">
          <div
            className="text-fog text-xs uppercase tracking-[0.22em] mb-12"
            style={{ fontWeight: 600 }}
          >
            مانیفست
          </div>

          <blockquote
            style={{
              fontWeight: 100,
              fontSize: "clamp(36px, 5.5vw, 72px)",
              lineHeight: 1.2,
              letterSpacing: "-0.025em",
              color: "var(--color-ink)",
              fontStyle: "italic",
            }}
          >
            «آنچه می‌گویی،
            <br />
            <span style={{ color: "var(--color-sage-deep)", fontWeight: 300 }}>همان شو.»</span>
          </blockquote>

          <p
            className="mt-10 text-stone"
            style={{ fontWeight: 300, fontSize: "16px", lineHeight: 1.9 }}
          >
            این جمله، جوهر همسو است. نه بیشتر. نه کمتر.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-24 px-6 lg:px-10">
        <div className="max-w-2xl mx-auto text-center reveal">
          <h2
            className="mb-4"
            style={{
              fontWeight: 100,
              fontSize: "clamp(26px, 3.5vw, 44px)",
              letterSpacing: "-0.02em",
              color: "var(--color-ink)",
            }}
          >
            می‌خواهی امتحان کنی؟
          </h2>
          <p
            className="text-stone mb-10"
            style={{ fontWeight: 300, fontSize: "17px", lineHeight: 1.8 }}
          >
            شروع رایگان است. بدون تعهد. بدون کارت بانکی.
          </p>
          <Link href="/login" className="btn btn-primary btn-lg">
            شروع کن — رایگان
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: "scaleX(-1)" }}
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
