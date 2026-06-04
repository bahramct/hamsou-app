// ─────────────────────────────────────────────────────────────────────────────
// صفحه اصلی (Landing Page) — پورت‌شده از public/landing.html به Next.js
// Server Component — رندر در سرور، SEO کامل
// افکت‌های JS (scroll reveal + parallax) در LandingEffects (client component)
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import { LandingEffects } from "@/components/features/landing/LandingEffects";

export default function HomePage() {
  return (
    <main className="grain">
      {/* افکت‌های کلاینت‌ساید */}
      <LandingEffects />

      {/* ── پس‌زمینه متحرک ── */}
      <div className="bg-stage">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════════════════════ */}
      <nav className="glass-nav fixed top-0 inset-x-0 z-50 anim-fade-in">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="همسو" width={40} height={40} className="h-9 w-auto" style={{ width: "auto" }} priority />
          </Link>
          <div className="nav-links flex items-center gap-1">
            <a href="#solution" className="px-4 py-2 rounded-full text-sm font-medium text-stone hover:text-ink hover:bg-black/5 transition-all duration-300">چطور کار می‌کند</a>
            <a href="#difference" className="px-4 py-2 rounded-full text-sm font-medium text-stone hover:text-ink hover:bg-black/5 transition-all duration-300">آنچه نیست</a>
            <a href="#testimonial" className="px-4 py-2 rounded-full text-sm font-medium text-stone hover:text-ink hover:bg-black/5 transition-all duration-300">از کاربران</a>
          </div>
          <Link href="/login" className="btn btn-primary" style={{ padding: ".65rem 1.25rem", fontSize: "14px" }}>شروع کن</Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 pt-32 pb-24 lg:pt-44 lg:pb-32 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="hero-grid grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-16 items-center" style={{ gridTemplateColumns: "1.3fr 1fr" }}>

            {/* متن */}
            <div>
              <div className="anim-fade-up d-1 mb-8">
                <span className="pill"><span className="pill-dot" />یک اپلیکیشن آرام برای توسعه فردی</span>
              </div>

              <h1 className="anim-fade-up d-2" style={{ fontWeight: 100, fontSize: "clamp(40px, 6.5vw, 92px)", lineHeight: 1.05, letterSpacing: "-0.025em", color: "var(--color-ink)" }}>
                هر روز یک <em style={{ fontStyle: "italic", fontWeight: 300 }}>تعهد</em> به خودت.
                <br />
                فردا، یک <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--color-sage-deep)" }}>پرسش آرام</em>.
              </h1>

              <p className="anim-fade-up d-3 mt-8 max-w-xl text-stone" style={{ fontWeight: 300, fontSize: "19px", lineHeight: 1.75 }}>
                همسو فاصله میان حرف و عملت را، بدون فشار و بدون قضاوت، کم می‌کند. نه برای بیشتر انجام دادن —{" "}
                <span className="text-ink" style={{ fontWeight: 400 }}>برای واقعی‌تر زندگی کردن.</span>
              </p>

              {/* CTA */}
              <div className="anim-fade-up d-4 mt-10 flex flex-wrap items-center gap-4">
                <Link href="/login" className="btn btn-primary btn-lg">
                  شروع کن — رایگان
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
                <a href="#solution" className="btn btn-ghost btn-lg">چطور کار می‌کند؟</a>
              </div>

              {/* Trust line */}
              <div className="anim-fade-up d-5 mt-10 flex items-center gap-3 text-stone text-sm" style={{ fontWeight: 300 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>رایگان · بدون کارت بانکی · حریم خصوصی کامل</span>
              </div>
            </div>

            {/* کارت‌های شناور — فقط دسکتاپ */}
            <div className="relative h-[520px] hidden lg:block">
              {/* کارت بالا */}
              <div className="float-card floaty anim-scale d-3 absolute top-0 right-0 w-[340px]" style={{ animationDelay: "0s, 220ms" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs" style={{ background: "rgba(122,132,113,0.14)", color: "var(--color-sage-deep)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-sage)", display: "inline-block" }} />
                    انجام شد
                  </span>
                  <span className="text-fog text-xs fa-num">۱۴۰۴/۰۳/۰۴</span>
                </div>
                <p style={{ fontWeight: 400, fontSize: "16px", lineHeight: 1.7 }}>امروز نیم‌ساعت پیاده‌روی می‌کنم و گوشی را کنار می‌گذارم.</p>
                <p className="mt-3 text-stone" style={{ fontWeight: 300, fontStyle: "italic", fontSize: "13px", borderRight: "2px solid var(--color-fog)", paddingRight: "10px" }}>واقعاً لذت بردم. فکر می‌کنم باید این کار را ادامه بدم.</p>
              </div>

              {/* کارت پایین */}
              <div className="float-card floaty anim-scale d-5 absolute bottom-0 left-0 w-[300px]" style={{ animationDelay: "1.5s, 380ms", transform: "rotate(-2deg)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs" style={{ background: "rgba(199,93,60,0.10)", color: "#9b4a31" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-ember)", display: "inline-block" }} />
                    انجام نشد
                  </span>
                  <span className="text-fog text-xs fa-num">۱۴۰۴/۰۳/۰۳</span>
                </div>
                <p style={{ fontWeight: 400, fontSize: "15px", lineHeight: 1.7 }}>به یک دوست قدیمی زنگ می‌زنم.</p>
                <p className="mt-3 text-stone" style={{ fontWeight: 300, fontStyle: "italic", fontSize: "13px", borderRight: "2px solid var(--color-fog)", paddingRight: "10px" }}>سرم شلوغ بود. شاید فردا.</p>
              </div>

              {/* پنل AI */}
              <div className="glass-tinted rounded-3xl p-5 floaty anim-fade-up d-7 absolute" style={{ bottom: "120px", right: "40px", width: "280px", animationDelay: "3s, 540ms" }}>
                <div className="flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-sage-deep)" }}>
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
                  </svg>
                  <span className="text-sage-deep" style={{ fontSize: "12px", fontWeight: 500 }}>پرسش آرام</span>
                </div>
                <p style={{ fontWeight: 300, fontSize: "14px", lineHeight: 1.7, color: "var(--color-charcoal)" }}>«دیدم که این هفته سه بار به این تعهد بازگشتی. می‌خواهی کمی درباره‌اش بنویسی؟»</p>
              </div>
            </div>
          </div>

          {/* کارت موبایل */}
          <div className="float-card lg:hidden mt-12 anim-scale d-4">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs" style={{ background: "rgba(122,132,113,0.14)", color: "var(--color-sage-deep)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-sage)", display: "inline-block" }} />
                انجام شد
              </span>
              <span className="text-fog text-xs fa-num">۱۴۰۴/۰۳/۰۴</span>
            </div>
            <p style={{ fontWeight: 400, fontSize: "16px", lineHeight: 1.7 }}>امروز نیم‌ساعت پیاده‌روی می‌کنم و گوشی را کنار می‌گذارم.</p>
            <p className="mt-3 text-stone" style={{ fontWeight: 300, fontStyle: "italic", fontSize: "13px", borderRight: "2px solid var(--color-fog)", paddingRight: "10px" }}>واقعاً لذت بردم.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          MANIFESTO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 lg:px-10 py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center reveal">
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="hr-line w-12 anim-line" />
            <span className="text-stone text-xs uppercase tracking-[0.18em]" style={{ fontWeight: 500 }}>مانیفست</span>
            <span className="hr-line w-12 anim-line" />
          </div>
          <blockquote style={{ fontWeight: 100, fontSize: "clamp(28px, 4.5vw, 52px)", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
            «ما نیامده‌ایم که دغدغه‌های تو را
            <br />
            بیشتر کنیم. آمده‌ایم که تو را{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--color-sage-deep)" }}>واقعی‌تر</em>
            {" "}کنیم.»
          </blockquote>
          <p className="mt-8 text-stone" style={{ fontWeight: 300, fontSize: "15px" }}>— مانیفست همسو</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          مشکل — ۰۱
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 lg:px-10 py-24 lg:py-28">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-20 items-start">
            <div className="reveal">
              <div className="ribbon-num fa-num">۰۱</div>
              <span className="text-stone text-sm mt-2 block" style={{ fontWeight: 500, letterSpacing: ".04em" }}>— مشکل</span>
            </div>
            <div className="reveal">
              <h2 style={{ fontWeight: 300, fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
                شاید مشکل تو،
                <br />
                <em style={{ fontStyle: "italic", color: "var(--color-sage-deep)" }}>کمبود انگیزه</em>
                {" "}نباشد.
              </h2>
              <div className="mt-8 space-y-5 text-stone max-w-xl" style={{ fontWeight: 300, fontSize: "17px", lineHeight: 1.85 }}>
                <p>صبح، با خودت قراری می‌گذاری. شب، فراموش کرده‌ای چه قراری بود. این فاصله‌ی کوچک، روز به روز بزرگ‌تر می‌شود. اعتمادت به کلمات خودت، آرام آرام فرو می‌ریزد.</p>
                <p style={{ color: "var(--color-ink)", fontWeight: 400 }}>نه — این تنبلی نیست. این خستگی از زندگی در میان وعده‌هایی است که با هیچ‌کس، حتی خودت، در میانشان نگذاشته‌ای.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          راه‌حل — ۰۲
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="solution" className="relative z-10 px-6 lg:px-10 py-24 lg:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 reveal">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="hr-line w-10" />
              <span className="text-stone text-xs uppercase tracking-[0.18em] fa-num" style={{ fontWeight: 500 }}>۰۲ — راه‌حل</span>
              <span className="hr-line w-10" />
            </div>
            <h2 style={{ fontWeight: 300, fontSize: "clamp(30px, 4.2vw, 50px)", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              یک چرخه ساده.{" "}
              <em style={{ fontStyle: "italic", color: "var(--color-sage-deep)" }}>یک تمرین صادقانه.</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* گام ۱ */}
            <div className="glass rounded-3xl p-8 hover-rise reveal">
              <div className="flex items-center justify-between mb-8">
                <div className="step-num fa-num">۱</div>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-fog)" }}>
                  <path d="M11 4H4v16h16v-7" /><path d="m17 3 4 4-9 9H8v-4z" />
                </svg>
              </div>
              <h3 style={{ fontWeight: 400, fontSize: "24px", letterSpacing: "-0.005em" }}>می‌نویسی</h3>
              <p className="mt-4 text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.85 }}>
                هر روز یک تعهد کوتاه به خودت. هر چه می‌خواهی — کاری، شخصی، احساسی. یک جمله، نه بیشتر.
              </p>
            </div>

            {/* گام ۲ */}
            <div className="glass rounded-3xl p-8 hover-rise reveal" style={{ transitionDelay: "60ms" }}>
              <div className="flex items-center justify-between mb-8">
                <div className="step-num fa-num">۲</div>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-fog)" }}>
                  <path d="M21 12a9 9 0 1 1-9-9" /><path d="M21 3v6h-6" />
                </svg>
              </div>
              <h3 style={{ fontWeight: 400, fontSize: "24px", letterSpacing: "-0.005em" }}>برمی‌گردی</h3>
              <p className="mt-4 text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.85 }}>
                فردا قبل از تعهد جدید، یک پرسش: دیروز چه شد؟ بدون نمره. بدون قضاوت. فقط بازتاب.
              </p>
            </div>

            {/* گام ۳ */}
            <div className="glass rounded-3xl p-8 hover-rise reveal" style={{ transitionDelay: "120ms" }}>
              <div className="flex items-center justify-between mb-8">
                <div className="step-num fa-num">۳</div>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-fog)" }}>
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
                </svg>
              </div>
              <h3 style={{ fontWeight: 400, fontSize: "24px", letterSpacing: "-0.005em" }}>می‌بینی</h3>
              <p className="mt-4 text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.85 }}>
                هر هفته، یک تحلیل آرام از روند خودت. AI آینه می‌شود، نه قاضی. نه نصیحت — فقط دیدن.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          تمایز — ۰۳
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="difference" className="relative z-10 px-6 lg:px-10 py-24 lg:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-16 reveal">
            <div className="flex items-center gap-3 mb-6">
              <span className="hr-line w-10" />
              <span className="text-stone text-xs uppercase tracking-[0.18em] fa-num" style={{ fontWeight: 500 }}>۰۳ — تمایز</span>
            </div>
            <h2 style={{ fontWeight: 300, fontSize: "clamp(30px, 4.2vw, 50px)", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              آنچه در همسو{" "}
              <em style={{ color: "var(--color-ember)", fontStyle: "italic", fontWeight: 300 }}>نیست</em>،
              {" "}مهم‌تر از آنچه هست.
            </h2>
          </div>

          <div className="glass-strong rounded-3xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* نیست */}
              <div className="p-10 lg:p-12" style={{ borderBottom: "1px solid rgba(26,26,31,0.06)" }}>
                <span className="text-ember text-xs uppercase tracking-[0.18em]" style={{ fontWeight: 600 }}>— نیست</span>
                <ul className="mt-8 space-y-7">
                  {[
                    { title: "استریک", desc: "چون یک روز شکستن نباید همه‌چیز را خراب کند." },
                    { title: "امتیاز و رتبه", desc: "چون رشد، با دیگران مقایسه نمی‌شود." },
                    { title: "نوتیفیکیشن مزاحم", desc: "چون صدای درون تو از زنگ ما مهم‌تر است." },
                    { title: "گیمیفیکیشن", desc: "چون زندگی واقعی، بازی نیست." },
                  ].map((item) => (
                    <li key={item.title} className="diff-not reveal">
                      <div style={{ fontWeight: 500, fontSize: "18px" }}>{item.title}</div>
                      <p className="mt-1 text-stone text-sm" style={{ fontWeight: 300, lineHeight: 1.7 }}>{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* هست */}
              <div className="p-10 lg:p-12" style={{ background: "linear-gradient(135deg, rgba(122,132,113,0.06), rgba(122,132,113,0.02))" }}>
                <span className="text-sage-deep text-xs uppercase tracking-[0.18em]" style={{ fontWeight: 600 }}>— هست</span>
                <ul className="mt-8 space-y-7">
                  {[
                    { title: "یک تعهد در روز", desc: "چون سادگی، خودش یک تصمیم است." },
                    { title: "AI به‌عنوان آینه", desc: "نه نصیحت‌گر. نه کوچ. فقط بازتاب." },
                    { title: "حریم خصوصی کامل", desc: "داده‌های تو نزد تو می‌مانند." },
                    { title: "سکوت، نه فشار", desc: "هر وقت آماده بودی — همسو منتظر است." },
                  ].map((item) => (
                    <li key={item.title} className="diff-yes reveal">
                      <div style={{ fontWeight: 500, fontSize: "18px" }}>{item.title}</div>
                      <p className="mt-1 text-stone text-sm" style={{ fontWeight: 300, lineHeight: 1.7 }}>{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          از کاربران — ۰۴
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="testimonial" className="relative z-10 px-6 lg:px-10 py-24 lg:py-32">
        <div className="max-w-3xl mx-auto text-center reveal">
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="hr-line w-10" />
            <span className="text-stone text-xs uppercase tracking-[0.18em] fa-num" style={{ fontWeight: 500 }}>۰۴ — از کاربران</span>
            <span className="hr-line w-10" />
          </div>
          <p className="qmark" style={{ fontWeight: 300, fontStyle: "italic", fontSize: "clamp(22px, 3.2vw, 34px)", lineHeight: 1.6, color: "var(--color-ink)", letterSpacing: "-0.005em" }}>
            اولین اپلیکیشنی است که هر روز باز می‌کنم، بدون اینکه احساس کنم چیزی از من می‌خواهد.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--color-bone)", color: "var(--color-sage-deep)", fontWeight: 300, fontSize: "18px" }}>س</div>
            <div className="text-right">
              <div style={{ fontWeight: 500 }}>سارا، ۳۲ ساله</div>
              <div className="text-stone text-sm" style={{ fontWeight: 300 }}>طراح UX — تهران</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="final" className="relative z-10 px-6 lg:px-10 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto reveal">
          <div className="glass-tinted rounded-[40px] p-12 lg:p-20 text-center relative overflow-hidden">
            {/* تزئین */}
            <div style={{ position: "absolute", top: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(122,132,113,0.35), transparent 70%)", filter: "blur(30px)" }} />
            <div style={{ position: "absolute", bottom: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(155,180,199,0.30), transparent 70%)", filter: "blur(30px)" }} />

            <div className="relative">
              <h2 style={{ fontWeight: 100, fontSize: "clamp(34px, 5.5vw, 64px)", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                امروز یک جمله بنویس.
                <br />
                ببین <em style={{ fontStyle: "italic", color: "var(--color-sage-deep)" }}>فردا</em> چه می‌گویی.
              </h2>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login" className="btn btn-primary btn-lg">
                  شروع کن
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <p className="mt-6 text-stone" style={{ fontWeight: 300, fontSize: "14px" }}>رایگان. بدون کارت بانکی. بدون نیاز به ایمیل کاری.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 px-6 lg:px-10 pt-16 pb-10" style={{ borderTop: "1px solid rgba(26,26,31,0.06)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <Image src="/logo.png" alt="همسو" width={40} height={40} className="h-10 w-auto mb-4" style={{ width: "auto" }} />
              <p className="text-stone" style={{ fontWeight: 300, fontSize: "14px", lineHeight: 1.7, maxWidth: "280px" }}>
                آینه‌ای آرام برای کلماتت. برای واقعی‌تر زندگی کردن.
              </p>
            </div>
            <div>
              <div className="text-fog text-xs uppercase tracking-[0.18em] mb-4" style={{ fontWeight: 600 }}>محصول</div>
              <ul className="space-y-3 text-stone text-sm" style={{ fontWeight: 300 }}>
                <li><a href="#solution" className="hover:text-ink transition-colors">چطور کار می‌کند</a></li>
                <li><a href="#difference" className="hover:text-ink transition-colors">آنچه همسو نیست</a></li>
                <li><a href="#" className="hover:text-ink transition-colors">سوالات رایج</a></li>
              </ul>
            </div>
            <div>
              <div className="text-fog text-xs uppercase tracking-[0.18em] mb-4" style={{ fontWeight: 600 }}>برند</div>
              <ul className="space-y-3 text-stone text-sm" style={{ fontWeight: 300 }}>
                <li><a href="#" className="hover:text-ink transition-colors">درباره ما</a></li>
                <li><a href="#" className="hover:text-ink transition-colors">حریم خصوصی</a></li>
                <li><a href="#" className="hover:text-ink transition-colors">تماس آرام</a></li>
              </ul>
            </div>
          </div>

          <hr className="hr-line mb-6" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-fog text-xs fa-num" style={{ fontWeight: 300 }}>© ۱۴۰۵ همسو · کلیه حقوق محفوظ است.</p>
            <p className="text-fog text-xs" style={{ fontWeight: 300, fontStyle: "italic" }}>«آنچه می‌گویی، همان شو.»</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
