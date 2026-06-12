// ─────────────────────────────────────────────────────────────────────────────
// about.tsx — تعریفِ سکشن‌های صفحهٔ «درباره ما» (DECISION-066)
// هر سکشن: کامپوننتِ رندر (طراحیِ دقیقاً یکسان با نسخهٔ دست‌ساز) + فیلدها + پیش‌فرض.
// مقادیرِ پیش‌فرض = همان متنِ فعلیِ صفحه → رندرِ اولیه بدونِ هیچ تغییرِ بصری.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import type { SectionDef, SectionRenderProps } from "@/lib/cms/types";

// آیکونِ فلشِ CTA (هم‌سان با صفحهٔ فعلی)
function Arrow() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: "scaleX(-1)" }}
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

// ═══════════════════════ ۱) HERO ═══════════════════════
function AboutHero({ c }: SectionRenderProps) {
  return (
    <>
      <section className="relative z-10 pt-28 pb-12 px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="anim-fade-up d-1 mb-6 flex items-center gap-2" style={{ fontWeight: 300, fontSize: "14px" }}>
            <Link href="/" className="text-fog hover:text-stone transition-colors">همسو</Link>
            <span className="text-fog" style={{ opacity: 0.5 }}>›</span>
            <span className="text-stone">درباره ما</span>
          </div>

          <div className="anim-fade-up d-2 mb-6">
            <span className="pill"><span className="pill-dot" />{c.text("pill")}</span>
          </div>

          <h1
            className="anim-fade-up d-3"
            style={{ fontWeight: 100, fontSize: c.fontSize("title"), lineHeight: 1.08, letterSpacing: "-0.025em", color: "var(--color-ink)" }}
          >
            {c.text("titleLead")}{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--color-sage-deep)" }}>
              {c.text("titleEmphasis")}
            </em>
          </h1>

          <p
            className="anim-fade-up d-4 mt-6 text-stone"
            style={{ fontWeight: 300, fontSize: c.fontSize("subtitle"), lineHeight: 1.8, maxWidth: "580px" }}
          >
            {c.text("subtitle")}
          </p>
        </div>
      </section>
      <hr className="hr-line mx-6 lg:mx-10 relative z-10" />
    </>
  );
}

const aboutHero: SectionDef = {
  type: "about-hero",
  label: "درباره — سرتیتر (Hero)",
  pages: ["about"],
  fields: [
    { key: "pill", label: "برچسب بالا", type: "text" },
    { key: "titleLead", label: "عنوان — بخش اول", type: "text", defaultFontSize: "clamp(30px, 4.4vw, 48px)" },
    { key: "titleEmphasis", label: "عنوان — بخش تأکید (سبز/مورب)", type: "text" },
    { key: "subtitle", label: "زیرعنوان", type: "textarea", defaultFontSize: "17px" },
  ],
  defaults: {
    pill: "ماهیت",
    titleLead: "از یک سوال",
    titleEmphasis: "ساخته شد.",
    subtitle: "چرا فاصله‌ای بین آنچه می‌گوییم و آنچه می‌کنیم هست؟",
  },
  defaultStyles: { title: { fontSize: "clamp(30px, 4.4vw, 48px)" }, subtitle: { fontSize: "17px" } },
  Component: AboutHero,
};

// ═══════════════════════ ۲) تیزرِ داستان ═══════════════════════
function AboutStoryTeaser({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 py-14 px-6 lg:px-10">
      <div className="max-w-4xl mx-auto reveal">
        <div
          className="rounded-2xl p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
          style={{ background: "rgba(122,132,113,0.05)", border: "1px solid rgba(122,132,113,0.11)" }}
        >
          <div>
            <p className="mb-1" style={{ fontWeight: 300, fontSize: c.fontSize("title"), color: "var(--color-ink)" }}>
              {c.text("title")}
            </p>
            <p className="text-stone" style={{ fontWeight: 300, fontSize: c.fontSize("text"), lineHeight: 1.75 }}>
              {c.text("text")}
            </p>
          </div>
          <Link href="/story" className="btn btn-ghost shrink-0" style={{ fontSize: "14px" }}>
            {c.text("ctaLabel")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

const aboutStoryTeaser: SectionDef = {
  type: "about-story-teaser",
  label: "درباره — تیزرِ داستان",
  pages: ["about"],
  fields: [
    { key: "title", label: "عنوان", type: "text", defaultFontSize: "16px" },
    { key: "text", label: "متن", type: "textarea", defaultFontSize: "14px" },
    { key: "ctaLabel", label: "متنِ دکمه", type: "text" },
  ],
  defaults: {
    title: "از کجا آمد این ایده؟",
    text: "روایتِ کامل شکل‌گیری همسو — یک داستانِ واقعی از یک لحظه‌ی صادقانه.",
    ctaLabel: "بخوان",
  },
  Component: AboutStoryTeaser,
};

// ═══════════════════════ ۳) چرا همسو ═══════════════════════
function AboutWhy({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 py-16 px-6 lg:px-10">
      <div className="max-w-3xl mx-auto">
        <div className="reveal mb-8">
          <div className="text-fog text-xs uppercase tracking-[0.18em] mb-6" style={{ fontWeight: 600 }}>
            {c.text("eyebrow")}
          </div>
        </div>
        <div className="space-y-6 reveal">
          <p style={{ fontWeight: 100, fontSize: c.fontSize("statement"), lineHeight: 1.7, color: "var(--color-ink)", letterSpacing: "-0.01em", whiteSpace: "pre-line" }}>
            {c.text("statement")}
          </p>
          <p className="text-stone" style={{ fontWeight: 300, fontSize: c.fontSize("para1"), lineHeight: 2 }}>
            {c.text("para1")}
          </p>
          <p className="text-stone" style={{ fontWeight: 300, fontSize: c.fontSize("para2"), lineHeight: 2 }}>
            {c.text("para2")}
          </p>
          <p style={{ fontWeight: 300, fontSize: c.fontSize("highlight"), lineHeight: 1.6, color: "var(--color-sage-deep)", borderRight: "3px solid var(--color-sage)", paddingRight: "1.25rem" }}>
            {c.text("highlight")}
          </p>
        </div>
      </div>
    </section>
  );
}

const aboutWhy: SectionDef = {
  type: "about-why",
  label: "درباره — چرا همسو",
  pages: ["about"],
  fields: [
    { key: "eyebrow", label: "تیترِ کوچک بالا", type: "text" },
    { key: "statement", label: "جملهٔ بزرگ (با Enter چندخطی)", type: "textarea", defaultFontSize: "clamp(19px, 2.2vw, 26px)" },
    { key: "para1", label: "پاراگراف اول", type: "textarea", defaultFontSize: "16px" },
    { key: "para2", label: "پاراگراف دوم", type: "textarea", defaultFontSize: "16px" },
    { key: "highlight", label: "جملهٔ تأکیدی (نقل‌قول سبز)", type: "textarea", defaultFontSize: "22px" },
  ],
  defaults: {
    eyebrow: "چرا همسو؟",
    statement: "هر روز کلمات زیادی می‌گوییم.\nتصمیم می‌گیریم. نیت می‌کنیم.",
    para1: "اما بین آنچه می‌گوییم و آنچه واقعاً انجام می‌دهیم، فاصله‌ای هست. نه از بی‌اراده‌گی —",
    para2: "بلکه چون هیچ آینه‌ای نداشتیم که این فاصله را صادقانه، بدون قضاوت، و بدون فشار به ما نشان دهد.",
    highlight: "همسو آن آینه است.",
  },
  Component: AboutWhy,
};

// ═══════════════════════ ۴) سه اصل ═══════════════════════
function AboutPrinciples({ c }: SectionRenderProps) {
  const cards = [
    { t: "card1Title", b: "card1Body", icon: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>, bg: "rgba(122,132,113,0.10)", bd: "rgba(122,132,113,0.20)", st: "var(--color-sage-deep)" },
    { t: "card2Title", b: "card2Body", icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></>, bg: "rgba(155,180,199,0.10)", bd: "rgba(155,180,199,0.22)", st: "var(--color-mist)" },
    { t: "card3Title", b: "card3Body", icon: <><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" /><line x1="16" y1="8" x2="2" y2="22" /><line x1="17.5" y1="15" x2="9" y2="15" /></>, bg: "rgba(193,154,74,0.08)", bd: "rgba(193,154,74,0.20)", st: "var(--color-gold)" },
  ];
  return (
    <section className="relative z-10 py-16 px-6 lg:px-10" style={{ background: "rgba(var(--rgb-bone),0.28)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 reveal">
          <div className="text-fog text-xs uppercase tracking-[0.18em] mb-5" style={{ fontWeight: 600 }}>
            {c.text("eyebrow")}
          </div>
          <h2 style={{ fontWeight: 100, fontSize: c.fontSize("heading"), letterSpacing: "-0.02em", color: "var(--color-ink)" }}>
            {c.text("heading")}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.t} className="glass-strong rounded-3xl p-7 reveal hover-rise">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: card.bg, border: `1px solid ${card.bd}` }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={card.st} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {card.icon}
                </svg>
              </div>
              <h3 className="mb-3" style={{ fontWeight: 400, fontSize: "16px", color: "var(--color-ink)" }}>
                {c.text(card.t)}
              </h3>
              <p className="text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.9 }}>
                {c.text(card.b)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const aboutPrinciples: SectionDef = {
  type: "about-principles",
  label: "درباره — سه اصل بنیادین",
  pages: ["about"],
  fields: [
    { key: "eyebrow", label: "تیترِ کوچک بالا", type: "text" },
    { key: "heading", label: "عنوان", type: "text", defaultFontSize: "clamp(23px, 2.8vw, 33px)" },
    { key: "card1Title", label: "کارت ۱ — عنوان", type: "text" },
    { key: "card1Body", label: "کارت ۱ — متن", type: "textarea" },
    { key: "card2Title", label: "کارت ۲ — عنوان", type: "text" },
    { key: "card2Body", label: "کارت ۲ — متن", type: "textarea" },
    { key: "card3Title", label: "کارت ۳ — عنوان", type: "text" },
    { key: "card3Body", label: "کارت ۳ — متن", type: "textarea" },
  ],
  defaults: {
    eyebrow: "اصول بنیادین",
    heading: "سه چیزی که هرگز تغییر نمی‌کنند",
    card1Title: "بدون قضاوت",
    card1Body: "همسو نه تشویق می‌کند نه سرزنش. روزهایی که تعهدت را انجام ندادی، داده است — نه شکست. فاصله‌ها هم بخشی از مسیرند.",
    card2Title: "استقلال واقعی",
    card2Body: "داده‌های تو، مال تو. هیچ الگوریتمی تصمیم‌هایت را هدایت نمی‌کند. همسو ابزار است — نه مرشد.",
    card3Title: "سادگی واقعی",
    card3Body: "یک تعهد. یک پرسش. یک گزارش. هرچیزی که انرژی‌ات را بگیرد به جای اینکه بدهد، در همسو نیست.",
  },
  defaultStyles: { heading: { fontSize: "clamp(23px, 2.8vw, 33px)" } },
  Component: AboutPrinciples,
};

// ═══════════════════════ ۵) همسو چه نیست ═══════════════════════
function AboutNotList({ c }: SectionRenderProps) {
  const items = c.list("items");
  return (
    <section className="relative z-10 py-16 px-6 lg:px-10">
      <div className="max-w-4xl mx-auto">
        <div className="reveal mb-10">
          <div className="text-fog text-xs uppercase tracking-[0.18em] mb-5" style={{ fontWeight: 600 }}>
            {c.text("eyebrow")}
          </div>
          <h2 style={{ fontWeight: 100, fontSize: c.fontSize("heading"), letterSpacing: "-0.02em", color: "var(--color-ink)" }}>
            {c.text("heading")}
          </h2>
        </div>
        {/* گرید دو ستونه و فشرده — به‌جای کارت‌های تمام‌عرضِ زیرِ هم (فضای کمتر، خوانایی همان) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="reveal flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{ background: "rgba(199,93,60,0.035)", border: "1px solid rgba(199,93,60,0.08)", animationDelay: `${i * 60}ms` }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(199,93,60,0.07)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-ember)" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <span className="text-stone" style={{ fontWeight: 300, fontSize: c.fontSize("items"), lineHeight: 1.7 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const aboutNotList: SectionDef = {
  type: "about-not-list",
  label: "درباره — همسو چه نیست",
  pages: ["about"],
  fields: [
    { key: "eyebrow", label: "تیترِ کوچک بالا", type: "text" },
    { key: "heading", label: "عنوان", type: "text", defaultFontSize: "clamp(23px, 2.8vw, 33px)" },
    { key: "items", label: "موارد (هر خط یک مورد)", type: "list", itemLabel: "مورد", defaultFontSize: "16px" },
  ],
  defaults: {
    eyebrow: "خط قرمز",
    heading: "همسو هرگز این نمی‌شود",
    items: [
      "Task Manager یا ابزار مدیریت پروژه",
      "Habit Tracker با استریک، امتیاز یا مدال",
      "اپلیکیشن انگیزشی با پیام‌های مصنوعی",
      "سیستم رقابت یا مقایسه با دیگران",
      "محیطی که کاربر را به خودش وابسته کند",
    ],
  },
  defaultStyles: { heading: { fontSize: "clamp(23px, 2.8vw, 33px)" }, items: { fontSize: "16px" } },
  Component: AboutNotList,
};

// ═══════════════════════ ۶) مانیفست ═══════════════════════
function AboutManifesto({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 py-20 px-6 lg:px-10 overflow-hidden" style={{ background: "rgba(92,101,85,0.04)" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(122,132,113,0.06), transparent)" }} />
      <div className="relative max-w-3xl mx-auto text-center reveal">
        <div className="text-fog text-xs uppercase tracking-[0.22em] mb-8" style={{ fontWeight: 600 }}>
          {c.text("eyebrow")}
        </div>
        <blockquote style={{ fontWeight: 100, fontSize: c.fontSize("quote"), lineHeight: 1.2, letterSpacing: "-0.025em", color: "var(--color-ink)", fontStyle: "italic" }}>
          «{c.text("quoteLead")}
          <br />
          <span style={{ color: "var(--color-sage-deep)", fontWeight: 300 }}>{c.text("quoteEmphasis")}»</span>
        </blockquote>
        <p className="mt-6 text-stone" style={{ fontWeight: 300, fontSize: "16px", lineHeight: 1.9 }}>
          {c.text("caption")}
        </p>
      </div>
    </section>
  );
}

const aboutManifesto: SectionDef = {
  type: "about-manifesto",
  label: "درباره — مانیفست",
  pages: ["about"],
  fields: [
    { key: "eyebrow", label: "تیترِ کوچک بالا", type: "text" },
    { key: "quoteLead", label: "نقل‌قول — بخش اول", type: "text", defaultFontSize: "clamp(27px, 4vw, 44px)" },
    { key: "quoteEmphasis", label: "نقل‌قول — بخش تأکید (سبز)", type: "text" },
    { key: "caption", label: "زیرنویس", type: "textarea" },
  ],
  defaults: {
    eyebrow: "مانیفست",
    quoteLead: "آنچه می‌گویی،",
    quoteEmphasis: "همان شو.",
    caption: "این جمله، جوهر همسو است. نه بیشتر. نه کمتر.",
  },
  defaultStyles: { quote: { fontSize: "clamp(27px, 4vw, 44px)" } },
  Component: AboutManifesto,
};

// ═══════════════════════ ۷) CTA ═══════════════════════
function AboutCta({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 py-16 px-6 lg:px-10">
      <div className="max-w-2xl mx-auto text-center reveal">
        <h2 className="mb-4" style={{ fontWeight: 100, fontSize: c.fontSize("heading"), letterSpacing: "-0.02em", color: "var(--color-ink)" }}>
          {c.text("heading")}
        </h2>
        <p className="text-stone mb-8" style={{ fontWeight: 300, fontSize: c.fontSize("text"), lineHeight: 1.8 }}>
          {c.text("text")}
        </p>
        <Link href="/login" className="btn btn-primary btn-lg">
          {c.text("ctaLabel")}
          <Arrow />
        </Link>
      </div>
    </section>
  );
}

const aboutCta: SectionDef = {
  type: "about-cta",
  label: "درباره — دعوت به اقدام (CTA)",
  pages: ["about"],
  fields: [
    { key: "heading", label: "عنوان", type: "text", defaultFontSize: "clamp(21px, 2.6vw, 30px)" },
    { key: "text", label: "متن", type: "textarea", defaultFontSize: "16px" },
    { key: "ctaLabel", label: "متنِ دکمه", type: "text" },
  ],
  defaults: {
    heading: "می‌خواهی امتحان کنی؟",
    text: "شروع رایگان است. بدون تعهد. بدون کارت بانکی.",
    ctaLabel: "شروع کن — رایگان",
  },
  defaultStyles: { heading: { fontSize: "clamp(21px, 2.6vw, 30px)" }, text: { fontSize: "16px" } },
  Component: AboutCta,
};

/** همهٔ سکشن‌های صفحهٔ درباره — به ترتیبِ پیش‌فرضِ صفحه. */
export const ABOUT_SECTIONS: SectionDef[] = [
  aboutHero,
  aboutStoryTeaser,
  aboutWhy,
  aboutPrinciples,
  aboutNotList,
  aboutManifesto,
  aboutCta,
];
