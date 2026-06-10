// ─────────────────────────────────────────────────────────────────────────────
// privacy.tsx — سکشن‌های «حریم خصوصی» (DECISION-066).
// چیدمانِ دوستونه + فهرستِ مطالب در PrivacyBody (components/cms/bodies.tsx) ساخته
// می‌شود؛ این سکشن‌ها فقط بدنه را رندر می‌کنند (heading/شماره/anchor با body است).
// هر بخش یک فیلدِ navTitle دارد که هم در فهرست و هم به‌عنوان عنوانِ بخش استفاده می‌شود.
// ردیف‌های جدول: هر آیتم «برچسب — مقدار» (جداکننده « — »).
// ─────────────────────────────────────────────────────────────────────────────

import type { SectionDef, SectionRenderProps } from "@/lib/cms/types";

function splitRow(s: string): { label: string; value: string } {
  const idx = s.indexOf(" — ");
  if (idx === -1) return { label: s, value: "" };
  return { label: s.slice(0, idx), value: s.slice(idx + 3) };
}

function DataTable({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="rounded-2xl overflow-hidden my-5" style={{ border: "1px solid rgba(var(--rgb-line),0.08)" }}>
      {items.map((item, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-1 sm:gap-4 px-5 py-3.5" style={{ borderTop: i > 0 ? "1px solid rgba(var(--rgb-line),0.06)" : undefined, background: i % 2 === 0 ? "rgba(var(--rgb-card),0.55)" : "rgba(var(--rgb-paper),0.5)" }}>
          <span className="shrink-0" style={{ fontWeight: 400, fontSize: "14px", color: "var(--color-ink)", minWidth: "140px" }}>{item.label}</span>
          <span style={{ fontWeight: 300, fontSize: "14px", color: "var(--color-stone)", lineHeight: 1.6 }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl my-4" style={{ background: "rgba(193,154,74,0.07)", border: "1px solid rgba(193,154,74,0.16)" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{ fontWeight: 300, fontSize: "14px", color: "var(--color-stone)", lineHeight: 1.75, margin: 0 }}>{children}</p>
    </div>
  );
}

// ═══ HERO (تمام‌عرض، توسط PrivacyBody بالای دو ستون رندر می‌شود) ═══
function PrivacyHero({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 pt-28 pb-12 px-6 lg:px-10">
      <div className="max-w-3xl mx-auto">
        <div className="anim-fade-up d-1 mb-6 flex items-center gap-2" style={{ fontWeight: 300, fontSize: "14px" }}>
          <a href="/" className="text-fog hover:text-stone transition-colors">همسو</a>
          <span className="text-fog" style={{ opacity: 0.5 }}>›</span>
          <span className="text-stone">حریم خصوصی</span>
        </div>
        <div className="anim-fade-up d-2 mb-6">
          <span className="pill"><span className="pill-dot" />{c.text("pill")}</span>
        </div>
        <h1 className="anim-fade-up d-3" style={{ fontWeight: 100, fontSize: c.fontSize("title"), lineHeight: 1.1, letterSpacing: "-0.025em", color: "var(--color-ink)" }}>
          {c.text("titleLead")}{" "}
          <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--color-sage-deep)" }}>{c.text("titleEmphasis")}</em>
        </h1>
        <p className="anim-fade-up d-4 mt-6 text-stone" style={{ fontWeight: 300, fontSize: c.fontSize("subtitle"), lineHeight: 1.85, maxWidth: "560px" }}>
          {c.text("subtitle")}
        </p>
      </div>
    </section>
  );
}
const privacyHero: SectionDef = {
  type: "privacy-hero", label: "حریم — سرتیتر", pages: ["privacy"],
  fields: [
    { key: "pill", label: "برچسب (آخرین به‌روزرسانی)", type: "text" },
    { key: "titleLead", label: "عنوان — بخش اول", type: "text", defaultFontSize: "clamp(28px, 4vw, 42px)" },
    { key: "titleEmphasis", label: "عنوان — بخش تأکید", type: "text" },
    { key: "subtitle", label: "زیرعنوان", type: "textarea", defaultFontSize: "16px" },
  ],
  defaults: {
    pill: "آخرین به‌روزرسانی: ۲۰ خرداد ۱۴۰۵",
    titleLead: "حریم خصوصی", titleEmphasis: "شما مهم است.",
    subtitle: "داده‌هایی که با همسو به اشتراک می‌گذارید — تعهداتت، بازخوردهایت — شخصی‌ترین بخش‌های زندگی توست. ما این را می‌دانیم.",
  },
  defaultStyles: { title: { fontSize: "clamp(28px, 4vw, 42px)" }, subtitle: { fontSize: "16px" } },
  Component: PrivacyHero,
};

// ═══ §۱ ═══
const privacy1: SectionDef = {
  type: "privacy-commitment", label: "حریم — ۱. تعهد", pages: ["privacy"],
  fields: [
    { key: "navTitle", label: "عنوانِ بخش (و فهرست)", type: "text" },
    { key: "paragraphs", label: "پاراگراف‌ها", type: "list", itemLabel: "پاراگراف" },
  ],
  defaults: {
    navTitle: "تعهد ما به حریم خصوصی شما",
    paragraphs: [
      "همسو یک محیط شخصی است — جایی که تعهدات روزانه، بازخوردها و مسیر رشد شما ثبت می‌شود. ما معتقدیم این داده‌ها باید کاملاً در کنترل شما باشند.",
      "ما داده‌های شما را نمی‌فروشیم، نمی‌اجاریم، و برای هیچ هدف تبلیغاتی استفاده نمی‌کنیم. سیاست حریم خصوصی ما ساده است: داده‌های شما، برای ارائه خدماتی که خواسته‌اید — نه بیشتر.",
    ],
  },
  Component: ({ c }: SectionRenderProps) => (
    <div className="prose-hamsoo">{c.list("paragraphs").map((p, i) => <p key={i}>{p}</p>)}</div>
  ),
};

// ═══ §۲ ═══
const privacy2: SectionDef = {
  type: "privacy-data-collected", label: "حریم — ۲. داده‌های جمع‌آوری‌شده", pages: ["privacy"],
  fields: [
    { key: "navTitle", label: "عنوانِ بخش", type: "text" },
    { key: "intro", label: "مقدمه", type: "textarea" },
    { key: "tableRows", label: "ردیف‌های جدول (برچسب — مقدار)", type: "list", itemLabel: "ردیف" },
    { key: "outro", label: "پاراگراف پایانی", type: "textarea" },
  ],
  defaults: {
    navTitle: "چه داده‌ای جمع‌آوری می‌کنیم؟",
    intro: "برای ارائه خدمات همسو، اطلاعات زیر ممکن است ذخیره شوند:",
    tableRows: [
      "شناسه ورود — شماره موبایل (ایران) یا آدرس ایمیل",
      "نام نمایشی — اختیاری — اگر تنظیم کنید",
      "تعهدات روزانه — متن تعهدی که هر روز ثبت می‌کنید",
      "بازخوردها — وضعیت (انجام شد / نشد) + یادداشت اختیاری",
      "گزارش‌های هفتگی — خروجی تحلیل هوش مصنوعی بر اساس داده‌های شما",
      "اطلاعات فنی — نوع مرورگر، IP (برای امنیت) — بدون ردیابی رفتاری",
    ],
    outro: "ما هیچ‌گاه موقعیت جغرافیایی دقیق، مخاطبین، یا داده‌های حساس دیگری جمع‌آوری نمی‌کنیم.",
  },
  Component: ({ c }: SectionRenderProps) => (
    <div className="prose-hamsoo">
      <p>{c.text("intro")}</p>
      <DataTable items={c.list("tableRows").map(splitRow)} />
      <p>{c.text("outro")}</p>
    </div>
  ),
};

// ═══ §۳ ═══
const privacy3: SectionDef = {
  type: "privacy-data-use", label: "حریم — ۳. استفاده از داده", pages: ["privacy"],
  fields: [
    { key: "navTitle", label: "عنوانِ بخش", type: "text" },
    { key: "intro", label: "مقدمه", type: "textarea" },
    { key: "items", label: "موارد", type: "list", itemLabel: "مورد" },
    { key: "note", label: "یادداشت (کادر زرد)", type: "textarea" },
  ],
  defaults: {
    navTitle: "از داده‌های شما چطور استفاده می‌کنیم؟",
    intro: "داده‌های شما فقط برای اهداف زیر استفاده می‌شوند:",
    items: [
      "ارائه خدمات اصلی همسو (ثبت تعهد، بازخورد، گزارش هفتگی)",
      "تولید گزارش هفتگی با کمک هوش مصنوعی — بدون ذخیره محتوای تعهدات در سرورهای AI",
      "احراز هویت و امنیت حساب کاربری",
      "بهبود کیفیت محصول بر اساس داده‌های جمعی و ناشناس (بدون شناسایی شما)",
    ],
    note: "گزارش هفتگی توسط هوش مصنوعی تولید می‌شود. در این فرآیند، متن تعهدات به صورت ناشناس (بدون نام یا شناسه) پردازش می‌شود و در سرورهای ارائه‌دهنده AI ذخیره نمی‌ماند.",
  },
  Component: ({ c }: SectionRenderProps) => (
    <div className="prose-hamsoo">
      <p>{c.text("intro")}</p>
      <ul>{c.list("items").map((it, i) => <li key={i}>{it}</li>)}</ul>
      <Note>{c.text("note")}</Note>
    </div>
  ),
};

// ═══ §۴ ═══
const privacy4: SectionDef = {
  type: "privacy-data-sharing", label: "حریم — ۴. اشتراک‌گذاری", pages: ["privacy"],
  fields: [
    { key: "navTitle", label: "عنوانِ بخش", type: "text" },
    { key: "highlight", label: "جملهٔ تأکیدی (سبز)", type: "textarea", defaultFontSize: "16px" },
    { key: "listIntro", label: "مقدمهٔ فهرست", type: "text" },
    { key: "items", label: "استثناها (برچسب — توضیح)", type: "list", itemLabel: "مورد" },
    { key: "outro", label: "پاراگراف پایانی", type: "textarea" },
  ],
  defaults: {
    navTitle: "داده‌ها را با چه کسی به اشتراک می‌گذاریم؟",
    highlight: "ما داده‌های شما را با هیچ شخص یا شرکت ثالثی به اشتراک نمی‌گذاریم.",
    listIntro: "استثناهای محدود:",
    items: [
      "ارائه‌دهندگان زیرساخت — سرویس‌های هاست و ایمیل که برای اجرای همسو ضروری‌اند — و همگی تابع قراردادهای حفاظت از داده هستند.",
      "الزامات قانونی — در صورت وجود حکم قضایی قانونی — با اطلاع شما در صورت امکان.",
    ],
    outro: "اگر در آینده تغییری در این سیاست ایجاد شود، قبل از اجرا به صورت واضح به شما اطلاع خواهیم داد.",
  },
  Component: ({ c }: SectionRenderProps) => (
    <div className="prose-hamsoo">
      <p style={{ fontWeight: 300, fontSize: c.fontSize("highlight"), color: "var(--color-sage-deep)", borderRight: "3px solid var(--color-sage)", paddingRight: "1rem", lineHeight: 1.7 }}>
        {c.text("highlight")}
      </p>
      <p>{c.text("listIntro")}</p>
      <ul>{c.list("items").map((it, i) => { const r = splitRow(it); return <li key={i}><strong>{r.label}:</strong> {r.value}</li>; })}</ul>
      <p>{c.text("outro")}</p>
    </div>
  ),
};

// ═══ §۵ ═══
const privacy5: SectionDef = {
  type: "privacy-security", label: "حریم — ۵. امنیت", pages: ["privacy"],
  fields: [
    { key: "navTitle", label: "عنوانِ بخش", type: "text" },
    { key: "intro", label: "مقدمه", type: "textarea" },
    { key: "items", label: "موارد", type: "list", itemLabel: "مورد" },
    { key: "outroPre", label: "پایانی — قبل از ایمیل", type: "textarea" },
    { key: "email", label: "ایمیل تماس", type: "text" },
    { key: "outroPost", label: "پایانی — بعد از ایمیل", type: "text" },
  ],
  defaults: {
    navTitle: "امنیت داده‌ها",
    intro: "ما اقدامات فنی و سازمانی زیر را برای حفاظت از داده‌های شما اجرا می‌کنیم:",
    items: [
      "رمزنگاری HTTPS برای تمام ارتباطات",
      "رمزنگاری رمز عبور با الگوریتم‌های یک‌طرفه (bcrypt)",
      "کدهای OTP با زمان انقضای کوتاه",
      "دسترسی محدود به داده‌ها برای تیم توسعه",
      "نسخه‌گیری منظم از پایگاه داده",
    ],
    outroPre: "هیچ سیستمی ۱۰۰٪ امن نیست. اگر مشکل امنیتی پیدا کردید، لطفاً فوری به",
    email: "hello@hamsouapp.ir",
    outroPost: "اطلاع دهید.",
  },
  Component: ({ c }: SectionRenderProps) => (
    <div className="prose-hamsoo">
      <p>{c.text("intro")}</p>
      <ul>{c.list("items").map((it, i) => <li key={i}>{it}</li>)}</ul>
      <p>
        {c.text("outroPre")}{" "}
        <a href={`mailto:${c.text("email")}`} style={{ color: "var(--color-sage-deep)" }}>{c.text("email")}</a>{" "}
        {c.text("outroPost")}
      </p>
    </div>
  ),
};

// ═══ §۶ ═══
const privacy6: SectionDef = {
  type: "privacy-rights", label: "حریم — ۶. حقوق شما", pages: ["privacy"],
  fields: [
    { key: "navTitle", label: "عنوانِ بخش", type: "text" },
    { key: "intro", label: "مقدمه", type: "textarea" },
    { key: "tableRows", label: "ردیف‌های جدول (برچسب — مقدار)", type: "list", itemLabel: "ردیف" },
    { key: "outro", label: "پاراگراف پایانی", type: "textarea" },
  ],
  defaults: {
    navTitle: "حقوق شما",
    intro: "شما در هر زمان می‌توانید:",
    tableRows: [
      "حذف حساب — از بخش تنظیمات — تمام داده‌ها پاک می‌شوند",
      "ویرایش اطلاعات — نام، ایمیل، شماره موبایل از پروفایل",
      "دانلود داده‌ها — با درخواست از hello@hamsouapp.ir — در قالب JSON",
      "لغو اشتراک اطلاعیه‌ها — از بخش تنظیمات حساب",
    ],
    outro: "بر اساس قوانین جمهوری اسلامی ایران و اصول حفاظت از داده، ما پاسخگوی درخواست‌های مرتبط با داده‌های شخصی شما هستیم.",
  },
  Component: ({ c }: SectionRenderProps) => (
    <div className="prose-hamsoo">
      <p>{c.text("intro")}</p>
      <DataTable items={c.list("tableRows").map(splitRow)} />
      <p>{c.text("outro")}</p>
    </div>
  ),
};

// ═══ §۷ ═══
const privacy7: SectionDef = {
  type: "privacy-contact", label: "حریم — ۷. تماس", pages: ["privacy"],
  fields: [
    { key: "navTitle", label: "عنوانِ بخش", type: "text" },
    { key: "intro", label: "مقدمه", type: "textarea" },
    { key: "email", label: "ایمیل", type: "text" },
    { key: "outro", label: "پاراگراف پایانی", type: "textarea" },
  ],
  defaults: {
    navTitle: "تماس برای موارد حریم خصوصی",
    intro: "اگر سوال، نگرانی یا درخواستی درباره حریم خصوصی دارید، با ما تماس بگیرید:",
    email: "hello@hamsouapp.ir",
    outro: "ما متعهدیم ظرف ۷۲ ساعت به درخواست‌های حریم خصوصی پاسخ دهیم.",
  },
  Component: ({ c }: SectionRenderProps) => (
    <div className="prose-hamsoo">
      <p>{c.text("intro")}</p>
      <div className="mt-4 p-5 rounded-2xl flex items-center gap-4" style={{ background: "rgba(122,132,113,0.06)", border: "1px solid rgba(122,132,113,0.12)" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage-deep)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
        </svg>
        <a href={`mailto:${c.text("email")}`} style={{ fontWeight: 300, fontSize: "16px", color: "var(--color-ink)", direction: "ltr" }}>{c.text("email")}</a>
      </div>
      <p className="mt-4">{c.text("outro")}</p>
    </div>
  ),
};

/** سکشن‌های حریم — اولین مورد hero است؛ بقیه «بخش‌های محتوایی» در دو ستون. */
export const PRIVACY_SECTIONS: SectionDef[] = [
  privacyHero, privacy1, privacy2, privacy3, privacy4, privacy5, privacy6, privacy7,
];

/** typeهای hero — برای جداسازی در PrivacyBody. */
export const PRIVACY_HERO_TYPES = ["privacy-hero"];
