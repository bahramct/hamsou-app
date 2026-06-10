// ─────────────────────────────────────────────────────────────────────────────
// story.tsx — سکشن‌های صفحهٔ «داستان همسو» (DECISION-066).
// بلوک‌های روایی به سکشن‌های مجزا تبدیل شده‌اند تا قابلِ جابه‌جایی/حذف باشند؛
// محتوا و طراحیِ هر بلوک حفظ شده. هر بلوکِ نثر یک فیلدِ «پاراگراف‌ها» (list) دارد.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import type { SectionDef, SectionRenderProps } from "@/lib/cms/types";

// ═══ HERO ═══
function StoryHero({ c }: SectionRenderProps) {
  return (
    <>
      <section className="relative z-10 pt-36 pb-16 px-6 lg:px-10">
        <div className="max-w-2xl mx-auto">
          <div className="anim-fade-up d-1 mb-8 flex items-center gap-2" style={{ fontWeight: 300, fontSize: "14px" }}>
            <Link href="/" className="text-fog hover:text-stone transition-colors">همسو</Link>
            <span className="text-fog" style={{ opacity: 0.5 }}>›</span>
            <span className="text-stone">داستان</span>
          </div>
          <div className="anim-fade-up d-2 mb-6">
            <span className="pill"><span className="pill-dot" />{c.text("pill")}</span>
          </div>
          <h1 className="anim-fade-up d-3" style={{ fontWeight: 100, fontSize: c.fontSize("title"), lineHeight: 1.08, letterSpacing: "-0.025em", color: "var(--color-ink)" }}>
            {c.text("titleLead")}{" "}
            <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--color-sage-deep)" }}>{c.text("titleEmphasis")}</em>
          </h1>
          <div className="anim-fade-up d-4 mt-8 flex items-center gap-4" style={{ fontWeight: 300, fontSize: "13px" }}>
            <span className="text-fog">{c.text("date")}</span>
            <span className="text-fog" style={{ opacity: 0.4 }}>·</span>
            <span className="text-fog">{c.text("readTime")}</span>
          </div>
        </div>
      </section>
      <hr className="hr-line mx-6 lg:mx-10 relative z-10" />
    </>
  );
}
const storyHero: SectionDef = {
  type: "story-hero", label: "داستان — سرتیتر", pages: ["story"],
  fields: [
    { key: "pill", label: "برچسب بالا", type: "text" },
    { key: "titleLead", label: "عنوان — بخش اول", type: "text", defaultFontSize: "clamp(42px, 6vw, 80px)" },
    { key: "titleEmphasis", label: "عنوان — بخش تأکید", type: "text" },
    { key: "date", label: "تاریخ", type: "text" },
    { key: "readTime", label: "زمان مطالعه", type: "text" },
  ],
  defaults: {
    pill: "ریشه", titleLead: "داستانِ", titleEmphasis: "همسو",
    date: "خرداد ۱۴۰۳", readTime: "حدود ۷ دقیقه مطالعه",
  },
  defaultStyles: { title: { fontSize: "clamp(42px, 6vw, 80px)" } },
  Component: StoryHero,
};

// ═══ LEDE ═══
function StoryLede({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 py-20 px-6 lg:px-10">
      <div className="max-w-2xl mx-auto reveal">
        <p style={{ fontWeight: 100, fontSize: c.fontSize("line1"), lineHeight: 1.8, color: "var(--color-ink)", letterSpacing: "-0.015em" }}>
          {c.text("line1a")}
          <em style={{ fontStyle: "italic", color: "var(--color-sage-deep)" }}> {c.text("line1em")}</em>{" "}
          {c.text("line1b")}
        </p>
        <p className="mt-6" style={{ fontWeight: 100, fontSize: c.fontSize("line1"), lineHeight: 1.8, color: "var(--color-ink)", letterSpacing: "-0.015em" }}>
          {c.text("line2")}
        </p>
      </div>
    </section>
  );
}
const storyLede: SectionDef = {
  type: "story-lede", label: "داستان — جملهٔ آغازین", pages: ["story"],
  fields: [
    { key: "line1a", label: "خط اول — قبل", type: "text", defaultFontSize: "clamp(22px, 2.8vw, 36px)" },
    { key: "line1em", label: "خط اول — تأکید", type: "text" },
    { key: "line1b", label: "خط اول — بعد", type: "text" },
    { key: "line2", label: "خط دوم", type: "textarea" },
  ],
  defaults: {
    line1a: "سال‌هاست آدم‌ها", line1em: "به من می‌گویند", line1b: "که قرار است چیزی را شروع کنند.",
    line2: "و سال‌هاست که می‌بینم نمی‌شود.",
  },
  defaultStyles: { line1: { fontSize: "clamp(22px, 2.8vw, 36px)" } },
  Component: StoryLede,
};

// ═══ بلوکِ نثر (factory) ═══
function makeProse(type: string, label: string, paragraphs: string[]): SectionDef {
  function Prose({ c }: SectionRenderProps) {
    return (
      <section className="relative z-10 px-6 lg:px-10 py-3">
        <div className="max-w-2xl mx-auto prose-hamsoo reveal">
          {c.list("paragraphs").map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>
    );
  }
  return {
    type, label, pages: ["story"],
    fields: [{ key: "paragraphs", label: "پاراگراف‌ها", type: "list", itemLabel: "پاراگراف" }],
    defaults: { paragraphs },
    Component: Prose,
  };
}

// ═══ نقل‌قولِ کناری (factory) ═══
function makeQuote(type: string, label: string, opts: { lead: string; emphasis: string; centered?: boolean }): SectionDef {
  function Quote({ c }: SectionRenderProps) {
    const centered = opts.centered;
    return (
      <section className="relative z-10 px-6 lg:px-10 py-8">
        <div className="max-w-2xl mx-auto reveal">
          <blockquote
            style={
              centered
                ? { fontWeight: 100, fontSize: c.fontSize("quote"), lineHeight: 1.7, color: "var(--color-sage-deep)", letterSpacing: "-0.015em", textAlign: "center", fontStyle: "italic" }
                : { fontWeight: 100, fontSize: c.fontSize("quote"), lineHeight: 1.6, color: "var(--color-ink)", letterSpacing: "-0.02em", borderRight: "3px solid var(--color-sage)", paddingRight: "1.5rem", fontStyle: "italic", margin: "1rem 0" }
            }
          >
            {c.text("lead")}
            <br />
            <span style={centered ? { color: "var(--color-stone)", fontWeight: 300 } : { color: "var(--color-sage-deep)", fontWeight: 300 }}>
              {c.text("emphasis")}
            </span>
          </blockquote>
        </div>
      </section>
    );
  }
  return {
    type, label, pages: ["story"],
    fields: [
      { key: "lead", label: "نقل‌قول — بخش اول", type: "textarea", defaultFontSize: opts.centered ? "clamp(20px, 2.4vw, 32px)" : "clamp(22px, 2.8vw, 36px)" },
      { key: "emphasis", label: "نقل‌قول — بخش تأکید", type: "textarea" },
    ],
    defaults: { lead: opts.lead, emphasis: opts.emphasis },
    defaultStyles: { quote: { fontSize: opts.centered ? "clamp(20px, 2.4vw, 32px)" : "clamp(22px, 2.8vw, 36px)" } },
    Component: Quote,
  };
}

// ═══ تزئین (Ornament) — تکرارپذیر ═══
function StoryOrnament() {
  return (
    <div className="my-14 flex items-center justify-center gap-4" style={{ opacity: 0.28 }}>
      <span style={{ display: "inline-block", width: "48px", height: "1px", background: "var(--color-fog)" }} />
      <span style={{ fontSize: "11px", color: "var(--color-fog)", letterSpacing: "0.35em" }}>✦</span>
      <span style={{ display: "inline-block", width: "48px", height: "1px", background: "var(--color-fog)" }} />
    </div>
  );
}
const storyOrnament: SectionDef = {
  type: "story-ornament", label: "داستان — جداکنندهٔ تزئینی", pages: ["story"],
  fields: [], defaults: {}, Component: StoryOrnament,
};

// ═══ جملهٔ پایانی (قاب) ═══
function StoryClosing({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 px-6 lg:px-10 pt-8">
      <div className="max-w-2xl mx-auto">
        <div className="reveal mt-8 p-8 md:p-12 rounded-3xl text-center" style={{ background: "rgba(122,132,113,0.06)", border: "1px solid rgba(122,132,113,0.12)" }}>
          <p style={{ fontWeight: 100, fontSize: c.fontSize("quote"), lineHeight: 1.4, letterSpacing: "-0.025em", color: "var(--color-ink)", fontStyle: "italic" }}>
            {c.text("lead")}
            <br />
            <span style={{ color: "var(--color-sage-deep)", fontWeight: 300 }}>{c.text("emphasis")}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
const storyClosing: SectionDef = {
  type: "story-closing", label: "داستان — جملهٔ پایانی", pages: ["story"],
  fields: [
    { key: "lead", label: "نقل‌قول — بخش اول", type: "text", defaultFontSize: "clamp(26px, 3.5vw, 48px)" },
    { key: "emphasis", label: "نقل‌قول — بخش تأکید", type: "text" },
  ],
  defaults: { lead: "«آنچه می‌گویی،", emphasis: "همان شو.»" },
  defaultStyles: { quote: { fontSize: "clamp(26px, 3.5vw, 48px)" } },
  Component: StoryClosing,
};

// ═══ CTA ═══
function StoryCta({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 py-20 px-6 lg:px-10">
      <div className="max-w-2xl mx-auto reveal">
        <div className="glass-strong rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ boxShadow: "0 24px 64px rgba(46,44,40,0.08), inset 0 1px 0 rgba(255,255,255,0.7)" }}>
          <div>
            <p style={{ fontWeight: 300, fontSize: "20px", color: "var(--color-ink)", marginBottom: "6px" }}>{c.text("title")}</p>
            <p className="text-stone" style={{ fontWeight: 300, fontSize: "15px" }}>{c.text("subtitle")}</p>
          </div>
          <Link href="/login" className="btn btn-primary shrink-0">
            {c.text("ctaLabel")}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
const storyCta: SectionDef = {
  type: "story-cta", label: "داستان — دعوت به اقدام", pages: ["story"],
  fields: [
    { key: "title", label: "عنوان", type: "text" },
    { key: "subtitle", label: "زیرعنوان", type: "text" },
    { key: "ctaLabel", label: "متنِ دکمه", type: "text" },
  ],
  defaults: { title: "می‌خواهی شروع کنی؟", subtitle: "یک تعهد. فردا یک پرسش. همین.", ctaLabel: "شروع کن — رایگان" },
  Component: StoryCta,
};

const storyProse1 = makeProse("story-prose-1", "داستان — نثر ۱", [
  "نه از بی‌اراده‌گی. نه از تنبلی. نه از اینکه «نمی‌خواهند.»",
  "بلکه از چیزی ظریف‌تر — از اینکه هیچ آینه‌ای نبود که فاصله را نشان دهد.",
  "یک روز می‌گویی «از این هفته ورزش می‌کنم.» هفته می‌گذرد. هیچ‌کس نپرسید. هیچ‌چیزی ثبت نشد. فراموش می‌شود — نه از سر بی‌توجهی، بلکه چون زندگی ادامه دارد و حافظه‌ی ما برای این حرف‌های کوچک کوتاه است.",
  "و آن حرف‌های کوچک، همان‌هایی هستند که مسیر ما را می‌سازند.",
]);
const storyQuote1 = makeQuote("story-quote-1", "داستان — نقل‌قول ۱", {
  lead: "«فاصله‌ای بین آنچه می‌گوییم و آنچه انجام می‌دهیم هست —",
  emphasis: "نه از ضعف، بلکه از نبودِ آینه.»",
});
const storyProse2 = makeProse("story-prose-2", "داستان — نثر ۲", [
  "من این را در خودم دیدم.",
  "اول ندیدم — یا شاید نخواستم ببینم. آدم‌ها معمولاً ترجیح می‌دهند این فاصله را با یک ابزار جدید پُر کنند. با یک اپ. با یک روش. با یک سیستم که این‌بار، «حتماً» کار می‌کند.",
  "همه‌ی ابزارها را امتحان کردم. اپ‌هایی که با استریک و امتیاز و مدال سعی می‌کردند مرا وادار به کاری کنند — انگار که انسان‌ها بچه‌هایی هستند که به جایزه نیاز دارند. پلنرهایی که برای پُر کردنشان باید بیشتر از خودِ کار انرژی می‌گذاشتم. یادداشت‌هایی که بعد از چند هفته تبدیل می‌شدند به انبوهی از قول‌های فراموش‌شده.",
  "همه‌شان مشکل یکسانی داشتند: می‌خواستند به‌جای من تصمیم بگیرند. می‌خواستند مرا مدیریت کنند، انگیزه بدهند، کنترل کنند. هیچ‌کدام فقط یک آینه نبودند.",
]);
const storyProse3 = makeProse("story-prose-3", "داستان — نثر ۳ (آینه)", [
  "آینه قضاوت نمی‌کند.",
  "وقتی صبح مقابل آینه می‌ایستی و موهایت ژولیده است، آینه نمی‌گوید «بد است.» فقط نشان می‌دهد. تصمیم با توست.",
  "این همان چیزی بود که می‌خواستم برای تعهدهایم. نه یک مربی که بگوید چه کنم. نه یک الگوریتم که «بهترین مسیر» را تجویز کند. فقط چیزی که صادقانه نگه‌دارد: «دیروز گفتی این کار را می‌کنی. امروز چه شد؟»",
  "نه با لحن سرزنش. نه با ایموجی تشویق. فقط یک پرسش ساده — و فضایی برای پاسخ صادقانه. حتی اگر پاسخ «نشد» باشد.",
  "به‌خصوص اگر پاسخ «نشد» باشد.",
]);
const storyQuote2 = makeQuote("story-quote-2", "داستان — نقل‌قول ۲ (وسط)", {
  lead: "«همسو برای کسانی ساخته شد که می‌خواهند با خودشان صادق باشند —",
  emphasis: "نه برای کسانی که نیاز به تشویق دارند.»",
  centered: true,
});
const storyProse4 = makeProse("story-prose-4", "داستان — نثر ۴ (نام)", [
  "اسم را دیر انتخاب کردیم.",
  "مدت‌ها دنبال کلمه‌ای می‌گشتیم که هم فارسی باشد، هم چیزی بگوید. نه یک اسم «استارتاپی» که انگار از جعبه‌ای پر از حروف بیرون آمده. چیزی که خودش یک مفهوم باشد.",
  "همسو — در یک مسیر بودن. هم‌جهت. هم‌راستا.",
  "نه به معنای کامل بودن. نه به این معنا که هیچ‌وقت گم نشوی. بلکه به این معنا که وقتی می‌گویی و وقتی می‌کنی، از یک جنس باشند. که جهتت، جهتِ حرفت باشد.",
  "این ساده به نظر می‌رسد. اما برای اکثر ما — برای من — ساده نبود.",
]);
const storyProse5 = makeProse("story-prose-5", "داستان — نثر ۵ (امروز)", [
  "همسو ساخته شد برای آن لحظه‌ای که با خودت تنها هستی.",
  "نه لحظه‌ای که جلوی دیگران هستی و باید موفق به نظر برسی. نه لحظه‌ای که انگیزه داری و همه‌چیز روشن است. بلکه آن لحظه‌ی ساکت که می‌دانی دیروز چی گفتی — و می‌خواهی بدانی واقعاً چی شد.",
  "در آن لحظه، همسو فقط یک چیز می‌پرسد.",
  "و تو باید جواب بدهی — نه به همسو، بلکه به خودت.",
]);

// ثبتِ یکتا (هر type یک‌بار). ترتیبِ پیش‌فرضِ صفحه — با تکرارِ ornament — در pages.ts است.
export const STORY_SECTIONS: SectionDef[] = [
  storyHero, storyLede,
  storyProse1, storyQuote1, storyProse2,
  storyProse3, storyQuote2, storyProse4,
  storyProse5, storyOrnament, storyClosing, storyCta,
];
