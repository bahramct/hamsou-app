// ─────────────────────────────────────────────────────────────────────────────
// contact.tsx — سکشن‌های صفحهٔ «تماس با ما» (DECISION-066). طراحیِ یکسان با نسخهٔ دست‌ساز.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { CopyEmailButton } from "@/app/contact/CopyEmailButton";
import type { SectionDef, SectionRenderProps } from "@/lib/cms/types";

// ═══ HERO ═══
function ContactHero({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 pt-36 pb-16 px-6 lg:px-10">
      <div className="max-w-2xl mx-auto text-center">
        <div className="anim-fade-up d-1 mb-6 flex items-center justify-center gap-2" style={{ fontWeight: 300, fontSize: "14px" }}>
          <Link href="/" className="text-fog hover:text-stone transition-colors">همسو</Link>
          <span className="text-fog" style={{ opacity: 0.5 }}>›</span>
          <span className="text-stone">تماس با ما</span>
        </div>
        <div className="anim-fade-up d-2 mb-8 flex justify-center">
          <span className="pill"><span className="pill-dot" />{c.text("pill")}</span>
        </div>
        <h1 className="anim-fade-up d-3" style={{ fontWeight: 100, fontSize: c.fontSize("title"), lineHeight: 1.08, letterSpacing: "-0.025em", color: "var(--color-ink)" }}>
          {c.text("titleLead")}{" "}
          <em style={{ fontStyle: "italic", fontWeight: 300, color: "var(--color-sage-deep)" }}>{c.text("titleEmphasis")}</em>
        </h1>
        <p className="anim-fade-up d-4 mt-5 text-stone" style={{ fontWeight: 300, fontSize: c.fontSize("subtitle"), lineHeight: 1.8, whiteSpace: "pre-line" }}>
          {c.text("subtitle")}
        </p>
      </div>
    </section>
  );
}
const contactHero: SectionDef = {
  type: "contact-hero", label: "تماس — سرتیتر", pages: ["contact"],
  fields: [
    { key: "pill", label: "برچسب بالا", type: "text" },
    { key: "titleLead", label: "عنوان — بخش اول", type: "text", defaultFontSize: "clamp(38px, 5.5vw, 72px)" },
    { key: "titleEmphasis", label: "عنوان — بخش تأکید", type: "text" },
    { key: "subtitle", label: "زیرعنوان", type: "textarea", defaultFontSize: "18px" },
  ],
  defaults: {
    pill: "در دسترس هستیم",
    titleLead: "سوالی داری؟",
    titleEmphasis: "آرام بپرس.",
    subtitle: "ما از شنیدن از تو خوشحال می‌شویم —\nچه سوال داشته باشی، چه پیشنهاد، چه انتقاد.",
  },
  defaultStyles: { title: { fontSize: "clamp(38px, 5.5vw, 72px)" }, subtitle: { fontSize: "18px" } },
  Component: ContactHero,
};

// ═══ کارت تماس ═══
function ContactCard({ c }: SectionRenderProps) {
  const email = c.text("email");
  const ig = c.text("instagram");
  const x = c.text("twitter");
  return (
    <section className="relative z-10 py-8 px-6 lg:px-10">
      <div className="max-w-lg mx-auto reveal">
        <div className="glass-strong rounded-3xl overflow-hidden" style={{ boxShadow: "0 24px 64px rgba(46,44,40,0.10), inset 0 1px 0 rgba(255,255,255,0.7)" }}>
          {/* ایمیل */}
          <div className="p-7 flex items-center justify-between gap-4" style={{ borderBottom: "1px solid rgba(26,26,31,0.06)" }}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(122,132,113,0.10)", border: "1px solid rgba(122,132,113,0.18)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage-deep)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <div className="text-fog text-xs mb-1" style={{ fontWeight: 400, letterSpacing: "0.06em" }}>ایمیل</div>
                <a href={`mailto:${email}`} className="hover:text-sage-deep transition-colors" style={{ fontWeight: 300, fontSize: "16px", color: "var(--color-ink)", direction: "ltr", display: "inline-block" }}>{email}</a>
              </div>
            </div>
            <CopyEmailButton email={email} />
          </div>
          {/* اینستاگرام */}
          <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-7 hover:bg-black/[0.02] transition-colors" style={{ borderBottom: "1px solid rgba(26,26,31,0.06)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(199,93,60,0.07)", border: "1px solid rgba(199,93,60,0.14)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ember)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-fog text-xs mb-1" style={{ fontWeight: 400, letterSpacing: "0.06em" }}>اینستاگرام</div>
              <span style={{ fontWeight: 300, fontSize: "16px", color: "var(--color-ink)", direction: "ltr", display: "inline-block" }}>@{ig}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-fog)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          {/* توییتر/X */}
          <a href={`https://x.com/${x}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-7 hover:bg-black/[0.02] transition-colors" style={{ borderBottom: "1px solid rgba(26,26,31,0.06)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(26,26,31,0.05)", border: "1px solid rgba(26,26,31,0.10)" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="var(--color-charcoal)">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-fog text-xs mb-1" style={{ fontWeight: 400, letterSpacing: "0.06em" }}>X (توییتر)</div>
              <span style={{ fontWeight: 300, fontSize: "16px", color: "var(--color-ink)", direction: "ltr", display: "inline-block" }}>@{x}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-fog)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          {/* زمان پاسخ */}
          <div className="p-7 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(193,154,74,0.08)", border: "1px solid rgba(193,154,74,0.16)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <div className="text-fog text-xs mb-1" style={{ fontWeight: 400, letterSpacing: "0.06em" }}>زمان پاسخگویی</div>
              <span className="text-stone" style={{ fontWeight: 300, fontSize: "15px" }}>{c.text("responseTime")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
const contactCard: SectionDef = {
  type: "contact-card", label: "تماس — کارتِ راه‌های ارتباط", pages: ["contact"],
  fields: [
    { key: "email", label: "ایمیل", type: "text" },
    { key: "instagram", label: "اینستاگرام (بدون @)", type: "text" },
    { key: "twitter", label: "X / توییتر (بدون @)", type: "text" },
    { key: "responseTime", label: "زمان پاسخگویی", type: "text" },
  ],
  defaults: {
    email: "hello@hamsouapp.ir",
    instagram: "hamsouapp",
    twitter: "hamsouapp",
    responseTime: "معمولاً ظرف ۴۸ ساعت پاسخ می‌دهیم",
  },
  Component: ContactCard,
};

// ═══ کاربران فعلی ═══
function ContactExisting({ c }: SectionRenderProps) {
  return (
    <section className="relative z-10 py-16 px-6 lg:px-10">
      <div className="max-w-lg mx-auto reveal">
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ background: "rgba(122,132,113,0.06)", border: "1px solid rgba(122,132,113,0.12)" }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(122,132,113,0.12)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-sage-deep)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-stone" style={{ fontWeight: 300, fontSize: "14px", lineHeight: 1.75 }}>{c.text("text")}</p>
          </div>
          <Link href="/login" className="btn btn-ghost shrink-0" style={{ fontSize: "13px", padding: ".65rem 1.25rem" }}>{c.text("ctaLabel")}</Link>
        </div>
      </div>
    </section>
  );
}
const contactExisting: SectionDef = {
  type: "contact-existing", label: "تماس — راهنمای کاربرانِ فعلی", pages: ["contact"],
  fields: [
    { key: "text", label: "متن", type: "textarea" },
    { key: "ctaLabel", label: "متنِ دکمه", type: "text" },
  ],
  defaults: {
    text: "اگر کاربر همسو هستی و سوالت درباره حسابت است، بخش پشتیبانی درون اپ پاسخ سریع‌تری دارد.",
    ctaLabel: "ورود به اپ",
  },
  Component: ContactExisting,
};

export const CONTACT_SECTIONS: SectionDef[] = [contactHero, contactCard, contactExisting];
