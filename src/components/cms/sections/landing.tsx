// ─────────────────────────────────────────────────────────────────────────────
// landing.tsx — سکشن‌های صفحهٔ اصلی (DECISION-066). طراحیِ دقیقاً یکسان با نسخهٔ دست‌ساز.
// کارت‌های دموی شناورِ Hero ثابت‌اند (تزئینی)؛ فقط متنِ اصلی قابلِ ویرایش است.
// لیست‌های «نیست/هست»: هر آیتم به‌صورت «عنوان — توضیح» (جداکننده « — »).
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import type { SectionDef, SectionRenderProps } from "@/lib/cms/types";

function ArrowR() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function splitItem(s: string): { title: string; desc: string } {
  const idx = s.indexOf(" — ");
  if (idx === -1) return { title: s, desc: "" };
  return { title: s.slice(0, idx), desc: s.slice(idx + 3) };
}

// ═══ HERO ═══
function LandingHero({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 pt-28 pb-16 lg:pt-36 lg:pb-20 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="hero-grid grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 items-center" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
          <div>
            <div className="anim-fade-up d-1 mb-6">
              <span className="pill"><span className="pill-dot" />{c.text("pill")}</span>
            </div>
            <h1 className="anim-fade-up d-2" style={{ fontWeight: 100, fontSize: c.fontSize("title"), lineHeight: 1.1, letterSpacing: "-0.025em", color: "var(--color-ink)" }}>
              {c.text("t1a")}<em style={{ fontStyle: "italic", fontWeight: 300 }}>{c.text("t1em")}</em>{c.text("t1b")}
              <br />
              {c.text("t2a")}<em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--color-sage-deep)" }}>{c.text("t2em")}</em>{c.text("t2b")}
            </h1>
            <p className="anim-fade-up d-3 mt-6 max-w-xl text-stone" style={{ fontWeight: 300, fontSize: c.fontSize("para"), lineHeight: 1.75 }}>
              {c.text("paraA")}{" "}
              <span className="text-ink" style={{ fontWeight: 400 }}>{c.text("paraEm")}</span>
            </p>
            <div className="anim-fade-up d-4 mt-8 flex flex-wrap items-center gap-4">
              <Link href="/login" className="btn btn-primary btn-lg">{c.text("ctaPrimary")}<ArrowR /></Link>
              <a href="#solution" className="btn btn-ghost btn-lg">{c.text("ctaGhost")}</a>
            </div>
            <div className="anim-fade-up d-5 mt-8 flex items-center gap-3 text-stone text-sm" style={{ fontWeight: 300 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>{c.text("trustLine")}</span>
            </div>
          </div>

          {/* کارت‌های دموی شناور — تزئینی، ثابت */}
          <div className="relative h-[470px] hidden lg:block">
            <div className="float-card floaty anim-scale d-3 absolute top-0 right-0 w-[340px]" style={{ animationDelay: "0s, 220ms" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs" style={{ background: "rgba(122,132,113,0.14)", color: "var(--color-sage-deep)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-sage)", display: "inline-block" }} />انجام شد
                </span>
                <span className="text-fog text-xs fa-num">۱۴۰۴/۰۳/۰۴</span>
              </div>
              <p style={{ fontWeight: 400, fontSize: "16px", lineHeight: 1.7 }}>امروز نیم‌ساعت پیاده‌روی می‌کنم و گوشی را کنار می‌گذارم.</p>
              <p className="mt-3 text-stone" style={{ fontWeight: 300, fontStyle: "italic", fontSize: "13px", borderRight: "2px solid var(--color-fog)", paddingRight: "10px" }}>واقعاً لذت بردم. فکر می‌کنم باید این کار را ادامه بدم.</p>
            </div>
            <div className="float-card floaty anim-scale d-5 absolute bottom-0 left-0 w-[300px]" style={{ animationDelay: "1.5s, 380ms", transform: "rotate(-2deg)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs" style={{ background: "rgba(199,93,60,0.10)", color: "#9b4a31" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-ember)", display: "inline-block" }} />انجام نشد
                </span>
                <span className="text-fog text-xs fa-num">۱۴۰۴/۰۳/۰۳</span>
              </div>
              <p style={{ fontWeight: 400, fontSize: "15px", lineHeight: 1.7 }}>به یک دوست قدیمی زنگ می‌زنم.</p>
              <p className="mt-3 text-stone" style={{ fontWeight: 300, fontStyle: "italic", fontSize: "13px", borderRight: "2px solid var(--color-fog)", paddingRight: "10px" }}>سرم شلوغ بود. شاید فردا.</p>
            </div>
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

        <div className="float-card lg:hidden mt-12 anim-scale d-4">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs" style={{ background: "rgba(122,132,113,0.14)", color: "var(--color-sage-deep)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-sage)", display: "inline-block" }} />انجام شد
            </span>
            <span className="text-fog text-xs fa-num">۱۴۰۴/۰۳/۰۴</span>
          </div>
          <p style={{ fontWeight: 400, fontSize: "16px", lineHeight: 1.7 }}>امروز نیم‌ساعت پیاده‌روی می‌کنم و گوشی را کنار می‌گذارم.</p>
          <p className="mt-3 text-stone" style={{ fontWeight: 300, fontStyle: "italic", fontSize: "13px", borderRight: "2px solid var(--color-fog)", paddingRight: "10px" }}>واقعاً لذت بردم.</p>
        </div>
      </div>
    </section>
  );
}
const landingHero: SectionDef = {
  type: "landing-hero", label: "اصلی — سرتیتر (Hero)", pages: ["landing"],
  fields: [
    { key: "pill", label: "برچسب بالا", type: "text" },
    { key: "t1a", label: "عنوان خط۱ — قبل", type: "text", defaultFontSize: "clamp(32px, 4.8vw, 56px)" },
    { key: "t1em", label: "عنوان خط۱ — کلمهٔ مورب", type: "text" },
    { key: "t1b", label: "عنوان خط۱ — بعد", type: "text" },
    { key: "t2a", label: "عنوان خط۲ — قبل", type: "text" },
    { key: "t2em", label: "عنوان خط۲ — کلمهٔ سبز", type: "text" },
    { key: "t2b", label: "عنوان خط۲ — بعد", type: "text" },
    { key: "paraA", label: "توضیح", type: "textarea", defaultFontSize: "16px" },
    { key: "paraEm", label: "توضیح — جملهٔ پررنگ", type: "text" },
    { key: "ctaPrimary", label: "دکمهٔ اصلی", type: "text" },
    { key: "ctaGhost", label: "دکمهٔ دوم", type: "text" },
    { key: "trustLine", label: "خط اعتماد (پایین)", type: "text" },
  ],
  defaults: {
    pill: "یک اپلیکیشن آرام برای توسعه فردی",
    t1a: "هر روز یک ", t1em: "تعهد", t1b: " به خودت.",
    t2a: "فردا، یک ", t2em: "پرسش آرام", t2b: ".",
    paraA: "همسو فاصله میان حرف و عملت را، بدون فشار و بدون قضاوت، کم می‌کند. نه برای بیشتر انجام دادن —",
    paraEm: "برای واقعی‌تر زندگی کردن.",
    ctaPrimary: "شروع کن — رایگان", ctaGhost: "چطور کار می‌کند؟",
    trustLine: "رایگان · بدون کارت بانکی · حریم خصوصی کامل",
  },
  defaultStyles: { title: { fontSize: "clamp(32px, 4.8vw, 56px)" }, para: { fontSize: "16px" } },
  Component: LandingHero,
};

// ═══ مانیفست ═══
function LandingManifesto({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 px-6 lg:px-10 py-16 lg:py-20">
      <div className="max-w-4xl mx-auto text-center reveal">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="hr-line w-12 anim-line" />
          <span className="text-stone text-xs uppercase tracking-[0.18em]" style={{ fontWeight: 500 }}>{c.text("eyebrow")}</span>
          <span className="hr-line w-12 anim-line" />
        </div>
        <blockquote style={{ fontWeight: 100, fontSize: c.fontSize("quote"), lineHeight: 1.4, letterSpacing: "-0.01em" }}>
          {c.text("quoteA")}<em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--color-sage-deep)" }}>{c.text("quoteEm")}</em>{c.text("quoteB")}
        </blockquote>
        <p className="mt-6 text-stone" style={{ fontWeight: 300, fontSize: "15px" }}>{c.text("attribution")}</p>
      </div>
    </section>
  );
}
const landingManifesto: SectionDef = {
  type: "landing-manifesto", label: "اصلی — مانیفست", pages: ["landing"],
  fields: [
    { key: "eyebrow", label: "برچسب", type: "text" },
    { key: "quoteA", label: "نقل‌قول — قبل", type: "textarea", defaultFontSize: "clamp(22px, 3vw, 34px)" },
    { key: "quoteEm", label: "نقل‌قول — کلمهٔ سبز", type: "text" },
    { key: "quoteB", label: "نقل‌قول — بعد", type: "text" },
    { key: "attribution", label: "امضا", type: "text" },
  ],
  defaults: {
    eyebrow: "مانیفست",
    quoteA: "«ما نیامده‌ایم که دغدغه‌های تو را بیشتر کنیم. آمده‌ایم که تو را ",
    quoteEm: "واقعی‌تر", quoteB: " کنیم.»",
    attribution: "— مانیفست همسو",
  },
  defaultStyles: { quote: { fontSize: "clamp(22px, 3vw, 34px)" } },
  Component: LandingManifesto,
};

// ═══ مشکل ═══
function LandingProblem({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 px-6 lg:px-10 py-16 lg:py-20">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-3xl reveal">
          {/* eyebrow — همان الگوی section ۰۲ (یک hr-line + برچسب) */}
          <div className="flex items-center gap-3 mb-6">
            <span className="hr-line w-10" />
            <span className="text-stone text-xs uppercase tracking-[0.18em] fa-num" style={{ fontWeight: 500 }}>{c.text("eyebrow")}</span>
          </div>
          <h2 style={{ fontWeight: 300, fontSize: c.fontSize("heading"), lineHeight: 1.25, letterSpacing: "-0.01em" }}>
            {c.text("headingA")}<br />
            <em style={{ fontStyle: "italic", color: "var(--color-sage-deep)" }}>{c.text("headingEm")}</em>{c.text("headingB")}
          </h2>
          <div className="mt-6 space-y-4 text-stone max-w-xl" style={{ fontWeight: 300, fontSize: "16px", lineHeight: 1.85 }}>
            <p>{c.text("para1")}</p>
            <p style={{ color: "var(--color-ink)", fontWeight: 400 }}>{c.text("para2")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
const landingProblem: SectionDef = {
  type: "landing-problem", label: "اصلی — مشکل (۰۱)", pages: ["landing"],
  fields: [
    { key: "eyebrow", label: "برچسب شماره (مثل: ۰۱ — مشکل)", type: "text" },
    { key: "headingA", label: "عنوان — خط اول", type: "text", defaultFontSize: "clamp(23px, 2.9vw, 33px)" },
    { key: "headingEm", label: "عنوان — کلمهٔ سبز", type: "text" },
    { key: "headingB", label: "عنوان — بعد", type: "text" },
    { key: "para1", label: "پاراگراف اول", type: "textarea" },
    { key: "para2", label: "پاراگراف دوم (پررنگ)", type: "textarea" },
  ],
  defaults: {
    eyebrow: "۰۱ — مشکل",
    headingA: "شاید مشکل تو،", headingEm: "کمبود انگیزه", headingB: " نباشد.",
    para1: "صبح، با خودت قراری می‌گذاری. شب، فراموش کرده‌ای چه قراری بود. این فاصله‌ی کوچک، روز به روز بزرگ‌تر می‌شود. اعتمادت به کلمات خودت، آرام آرام فرو می‌ریزد.",
    para2: "نه — این تنبلی نیست. این خستگی از زندگی در میان وعده‌هایی است که با هیچ‌کس، حتی خودت، در میانشان نگذاشته‌ای.",
  },
  defaultStyles: { heading: { fontSize: "clamp(23px, 2.9vw, 33px)" } },
  Component: LandingProblem,
};

// ═══ راه‌حل ═══
function LandingSolution({ c }: SectionRenderProps) {
  const cards = [
    { t: "card1Title", b: "card1Body", icon: <><path d="M11 4H4v16h16v-7" /><path d="m17 3 4 4-9 9H8v-4z" /></> },
    { t: "card2Title", b: "card2Body", icon: <><path d="M21 12a9 9 0 1 1-9-9" /><path d="M21 3v6h-6" /></> },
    { t: "card3Title", b: "card3Body", icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /> },
  ];
  return (
    <section id="solution" className="relative z-10 px-6 lg:px-10 py-16 lg:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 reveal">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="hr-line w-10" />
            <span className="text-stone text-xs uppercase tracking-[0.18em] fa-num" style={{ fontWeight: 500 }}>{c.text("eyebrow")}</span>
            <span className="hr-line w-10" />
          </div>
          <h2 style={{ fontWeight: 300, fontSize: c.fontSize("heading"), lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            {c.text("headingA")}{" "}<em style={{ fontStyle: "italic", color: "var(--color-sage-deep)" }}>{c.text("headingEm")}</em>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, i) => (
            <div key={card.t} className="glass rounded-3xl p-7 hover-rise reveal" style={i > 0 ? { transitionDelay: `${i * 60}ms` } : undefined}>
              <div className="flex items-center justify-between mb-6">
                <div className="step-num fa-num">{["۱", "۲", "۳"][i]}</div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-fog)" }}>{card.icon}</svg>
              </div>
              <h3 style={{ fontWeight: 400, fontSize: "19px", letterSpacing: "-0.005em" }}>{c.text(card.t)}</h3>
              <p className="mt-4 text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.85 }}>{c.text(card.b)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
const landingSolution: SectionDef = {
  type: "landing-solution", label: "اصلی — راه‌حل (۰۲)", pages: ["landing"],
  fields: [
    { key: "eyebrow", label: "برچسب", type: "text" },
    { key: "headingA", label: "عنوان — بخش اول", type: "text", defaultFontSize: "clamp(24px, 3.2vw, 36px)" },
    { key: "headingEm", label: "عنوان — بخش سبز", type: "text" },
    { key: "card1Title", label: "گام۱ — عنوان", type: "text" }, { key: "card1Body", label: "گام۱ — متن", type: "textarea" },
    { key: "card2Title", label: "گام۲ — عنوان", type: "text" }, { key: "card2Body", label: "گام۲ — متن", type: "textarea" },
    { key: "card3Title", label: "گام۳ — عنوان", type: "text" }, { key: "card3Body", label: "گام۳ — متن", type: "textarea" },
  ],
  defaults: {
    eyebrow: "۰۲ — راه‌حل",
    headingA: "یک چرخه ساده.", headingEm: "یک تمرین صادقانه.",
    card1Title: "می‌نویسی", card1Body: "هر روز یک تعهد کوتاه به خودت. هر چه می‌خواهی — کاری، شخصی، احساسی. یک جمله، نه بیشتر.",
    card2Title: "برمی‌گردی", card2Body: "فردا قبل از تعهد جدید، یک پرسش: دیروز چه شد؟ بدون نمره. بدون قضاوت. فقط بازتاب.",
    card3Title: "می‌بینی", card3Body: "هر هفته، یک تحلیل آرام از روند خودت. AI آینه می‌شود، نه قاضی. نه نصیحت — فقط دیدن.",
  },
  defaultStyles: { heading: { fontSize: "clamp(24px, 3.2vw, 36px)" } },
  Component: LandingSolution,
};

// ═══ تمایز ═══
function LandingDifference({ c }: SectionRenderProps) {
  const notItems = c.list("notItems").map(splitItem);
  const yesItems = c.list("yesItems").map(splitItem);
  return (
    <section id="difference" className="relative z-10 px-6 lg:px-10 py-16 lg:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-12 reveal">
          <div className="flex items-center gap-3 mb-6">
            <span className="hr-line w-10" />
            <span className="text-stone text-xs uppercase tracking-[0.18em] fa-num" style={{ fontWeight: 500 }}>{c.text("eyebrow")}</span>
          </div>
          <h2 style={{ fontWeight: 300, fontSize: c.fontSize("heading"), lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            {c.text("headingA")}{" "}<em style={{ color: "var(--color-ember)", fontStyle: "italic", fontWeight: 300 }}>{c.text("headingEm")}</em>{c.text("headingB")}
          </h2>
        </div>
        <div className="glass-strong rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 lg:p-10" style={{ borderBottom: "1px solid rgba(var(--rgb-line),0.06)" }}>
              <span className="text-ember text-xs uppercase tracking-[0.18em]" style={{ fontWeight: 600 }}>{c.text("notLabel")}</span>
              <ul className="mt-8 space-y-5">
                {notItems.map((item, i) => (
                  <li key={i} className="diff-not reveal">
                    <div style={{ fontWeight: 500, fontSize: "16px" }}>{item.title}</div>
                    <p className="mt-1 text-stone text-sm" style={{ fontWeight: 300, lineHeight: 1.7 }}>{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 lg:p-10" style={{ background: "linear-gradient(135deg, rgba(122,132,113,0.06), rgba(122,132,113,0.02))" }}>
              <span className="text-sage-deep text-xs uppercase tracking-[0.18em]" style={{ fontWeight: 600 }}>{c.text("yesLabel")}</span>
              <ul className="mt-8 space-y-5">
                {yesItems.map((item, i) => (
                  <li key={i} className="diff-yes reveal">
                    <div style={{ fontWeight: 500, fontSize: "16px" }}>{item.title}</div>
                    <p className="mt-1 text-stone text-sm" style={{ fontWeight: 300, lineHeight: 1.7 }}>{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
const landingDifference: SectionDef = {
  type: "landing-difference", label: "اصلی — تمایز (۰۳)", pages: ["landing"],
  fields: [
    { key: "eyebrow", label: "برچسب", type: "text" },
    { key: "headingA", label: "عنوان — بخش اول", type: "text", defaultFontSize: "clamp(24px, 3.2vw, 36px)" },
    { key: "headingEm", label: "عنوان — کلمهٔ قرمز", type: "text" },
    { key: "headingB", label: "عنوان — بعد", type: "text" },
    { key: "notLabel", label: "عنوانِ ستونِ «نیست»", type: "text" },
    { key: "notItems", label: "نیست‌ها (هر خط: عنوان — توضیح)", type: "list", itemLabel: "مورد" },
    { key: "yesLabel", label: "عنوانِ ستونِ «هست»", type: "text" },
    { key: "yesItems", label: "هست‌ها (هر خط: عنوان — توضیح)", type: "list", itemLabel: "مورد" },
  ],
  defaults: {
    eyebrow: "۰۳ — تمایز",
    headingA: "آنچه در همسو", headingEm: "نیست", headingB: "، مهم‌تر از آنچه هست.",
    notLabel: "— نیست",
    notItems: [
      "استریک — چون یک روز شکستن نباید همه‌چیز را خراب کند.",
      "امتیاز و رتبه — چون رشد، با دیگران مقایسه نمی‌شود.",
      "نوتیفیکیشن مزاحم — چون صدای درون تو از زنگ ما مهم‌تر است.",
      "گیمیفیکیشن — چون زندگی واقعی، بازی نیست.",
    ],
    yesLabel: "— هست",
    yesItems: [
      "یک تعهد در روز — چون سادگی، خودش یک تصمیم است.",
      "AI به‌عنوان آینه — نه نصیحت‌گر. نه کوچ. فقط بازتاب.",
      "حریم خصوصی کامل — داده‌های تو نزد تو می‌مانند.",
      "سکوت، نه فشار — هر وقت آماده بودی — همسو منتظر است.",
    ],
  },
  defaultStyles: { heading: { fontSize: "clamp(24px, 3.2vw, 36px)" } },
  Component: LandingDifference,
};

// ═══ از کاربران ═══
function LandingTestimonial({ c }: SectionRenderProps) {
  return (
    <section id="testimonial" className="relative z-10 px-6 lg:px-10 py-16 lg:py-20">
      <div className="max-w-3xl mx-auto text-center reveal">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="hr-line w-10" />
          <span className="text-stone text-xs uppercase tracking-[0.18em] fa-num" style={{ fontWeight: 500 }}>{c.text("eyebrow")}</span>
          <span className="hr-line w-10" />
        </div>
        <p className="qmark" style={{ fontWeight: 300, fontStyle: "italic", fontSize: c.fontSize("quote"), lineHeight: 1.6, color: "var(--color-ink)", letterSpacing: "-0.005em" }}>
          {c.text("quote")}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--color-bone)", color: "var(--color-sage-deep)", fontWeight: 300, fontSize: "16px" }}>{c.text("avatarLetter")}</div>
          <div className="text-right">
            <div style={{ fontWeight: 500 }}>{c.text("name")}</div>
            <div className="text-stone text-sm" style={{ fontWeight: 300 }}>{c.text("role")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
const landingTestimonial: SectionDef = {
  type: "landing-testimonial", label: "اصلی — از کاربران (۰۴)", pages: ["landing"],
  fields: [
    { key: "eyebrow", label: "برچسب", type: "text" },
    { key: "quote", label: "نقل‌قول", type: "textarea", defaultFontSize: "clamp(18px, 2.4vw, 25px)" },
    { key: "avatarLetter", label: "حرفِ آواتار", type: "text" },
    { key: "name", label: "نام", type: "text" },
    { key: "role", label: "نقش/شهر", type: "text" },
  ],
  defaults: {
    eyebrow: "۰۴ — از کاربران",
    quote: "اولین اپلیکیشنی است که هر روز باز می‌کنم، بدون اینکه احساس کنم چیزی از من می‌خواهد.",
    avatarLetter: "س", name: "سارا، ۳۲ ساله", role: "طراح UX — تهران",
  },
  defaultStyles: { quote: { fontSize: "clamp(18px, 2.4vw, 25px)" } },
  Component: LandingTestimonial,
};

// ═══ CTA نهایی ═══
function LandingFinalCta({ c }: SectionRenderProps) {
  return (
    <section id="final" className="relative z-10 px-6 lg:px-10 py-16 lg:py-20">
      <div className="max-w-5xl mx-auto reveal">
        <div className="glass-tinted rounded-[32px] p-10 lg:p-14 text-center relative overflow-hidden">
          <div style={{ position: "absolute", top: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(122,132,113,0.35), transparent 70%)", filter: "blur(30px)" }} />
          <div style={{ position: "absolute", bottom: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(155,180,199,0.30), transparent 70%)", filter: "blur(30px)" }} />
          <div className="relative">
            <h2 style={{ fontWeight: 100, fontSize: c.fontSize("heading"), lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              {c.text("headingA")}<br />
              {c.text("headingMid")}<em style={{ fontStyle: "italic", color: "var(--color-sage-deep)" }}>{c.text("headingEm")}</em>{c.text("headingB")}
            </h2>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="btn btn-primary btn-lg">{c.text("ctaLabel")}<ArrowR /></Link>
            </div>
            <p className="mt-6 text-stone" style={{ fontWeight: 300, fontSize: "14px" }}>{c.text("subtext")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
const landingFinalCta: SectionDef = {
  type: "landing-final-cta", label: "اصلی — دعوتِ پایانی", pages: ["landing"],
  fields: [
    { key: "headingA", label: "عنوان — خط اول", type: "text", defaultFontSize: "clamp(26px, 3.8vw, 42px)" },
    { key: "headingMid", label: "عنوان — خط دوم قبل", type: "text" },
    { key: "headingEm", label: "عنوان — کلمهٔ سبز", type: "text" },
    { key: "headingB", label: "عنوان — بعد", type: "text" },
    { key: "ctaLabel", label: "متنِ دکمه", type: "text" },
    { key: "subtext", label: "زیرنویس", type: "text" },
  ],
  defaults: {
    headingA: "امروز یک جمله بنویس.",
    headingMid: "ببین ", headingEm: "فردا", headingB: " چه می‌گویی.",
    ctaLabel: "شروع کن", subtext: "رایگان. بدون کارت بانکی. بدون نیاز به ایمیل کاری.",
  },
  defaultStyles: { heading: { fontSize: "clamp(26px, 3.8vw, 42px)" } },
  Component: LandingFinalCta,
};

export const LANDING_SECTIONS: SectionDef[] = [
  landingHero, landingManifesto, landingProblem, landingSolution, landingDifference, landingTestimonial, landingFinalCta,
];
