import type { Metadata } from "next";
import Link from "next/link";
import { LandingEffects } from "@/components/features/landing/LandingEffects";
import { LandingNav } from "@/components/layout/LandingNav";
import { LandingFooter } from "@/components/layout/LandingFooter";

export const metadata: Metadata = {
  title: "داستان همسو — چرا این ابزار ساخته شد",
  description:
    "یک شب، یک پرسش، یک آینه. داستانِ شکل‌گیری همسو از یک لحظه‌ی صادقانه آغاز شد.",
};

function Ornament() {
  return (
    <div
      className="my-14 flex items-center justify-center gap-4"
      style={{ opacity: 0.28 }}
    >
      <span
        style={{
          display: "inline-block",
          width: "48px",
          height: "1px",
          background: "var(--color-fog)",
        }}
      />
      <span
        style={{
          fontSize: "11px",
          color: "var(--color-fog)",
          letterSpacing: "0.35em",
        }}
      >
        ✦
      </span>
      <span
        style={{
          display: "inline-block",
          width: "48px",
          height: "1px",
          background: "var(--color-fog)",
        }}
      />
    </div>
  );
}

export default function StoryPage() {
  return (
    <main className="grain">
      <LandingEffects />

      <div className="bg-stage" style={{ opacity: 0.4 }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <LandingNav />

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 pt-36 pb-16 px-6 lg:px-10">
        <div className="max-w-2xl mx-auto">
          <div
            className="anim-fade-up d-1 mb-8 flex items-center gap-2"
            style={{ fontWeight: 300, fontSize: "14px" }}
          >
            <Link href="/" className="text-fog hover:text-stone transition-colors">
              همسو
            </Link>
            <span className="text-fog" style={{ opacity: 0.5 }}>
              ›
            </span>
            <span className="text-stone">داستان</span>
          </div>

          <div className="anim-fade-up d-2 mb-6">
            <span className="pill">
              <span className="pill-dot" />
              ریشه
            </span>
          </div>

          <h1
            className="anim-fade-up d-3"
            style={{
              fontWeight: 100,
              fontSize: "clamp(42px, 6vw, 80px)",
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              color: "var(--color-ink)",
            }}
          >
            داستانِ{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                color: "var(--color-sage-deep)",
              }}
            >
              همسو
            </em>
          </h1>

          <div
            className="anim-fade-up d-4 mt-8 flex items-center gap-4"
            style={{ fontWeight: 300, fontSize: "13px" }}
          >
            <span className="text-fog">خرداد ۱۴۰۳</span>
            <span className="text-fog" style={{ opacity: 0.4 }}>
              ·
            </span>
            <span className="text-fog">حدود ۷ دقیقه مطالعه</span>
          </div>
        </div>
      </section>

      <hr className="hr-line mx-6 lg:mx-10 relative z-10" />

      {/* ══════════════════════════════════════════════════════════════════════
          LEDE — جمله‌ی آغازین
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-20 px-6 lg:px-10">
        <div className="max-w-2xl mx-auto reveal">
          <p
            style={{
              fontWeight: 100,
              fontSize: "clamp(22px, 2.8vw, 36px)",
              lineHeight: 1.8,
              color: "var(--color-ink)",
              letterSpacing: "-0.015em",
            }}
          >
            سال‌هاست آدم‌ها
            <em style={{ fontStyle: "italic", color: "var(--color-sage-deep)" }}>
              {" "}به من می‌گویند
            </em>{" "}
            که قرار است چیزی را شروع کنند.
          </p>
          <p
            className="mt-6"
            style={{
              fontWeight: 100,
              fontSize: "clamp(22px, 2.8vw, 36px)",
              lineHeight: 1.8,
              color: "var(--color-ink)",
              letterSpacing: "-0.015em",
            }}
          >
            و سال‌هاست که می‌بینم نمی‌شود.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PROSE — متن اصلی
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 pb-8 px-6 lg:px-10">
        <div className="max-w-2xl mx-auto">

          {/* بخش ۱ */}
          <div className="prose-hamsoo reveal">
            <p>
              نه از بی‌اراده‌گی. نه از تنبلی. نه از اینکه «نمی‌خواهند.»
            </p>
            <p>
              بلکه از چیزی ظریف‌تر — از اینکه هیچ آینه‌ای نبود که فاصله را نشان دهد.
            </p>
            <p>
              یک روز می‌گویی «از این هفته ورزش می‌کنم.» هفته می‌گذرد.
              هیچ‌کس نپرسید. هیچ‌چیزی ثبت نشد. فراموش می‌شود —
              نه از سر بی‌توجهی، بلکه چون زندگی ادامه دارد و حافظه‌ی ما
              برای این حرف‌های کوچک کوتاه است.
            </p>
            <p>
              و آن حرف‌های کوچک، همان‌هایی هستند که مسیر ما را می‌سازند.
            </p>
          </div>

          {/* pull quote ۱ */}
          <blockquote
            className="reveal my-14"
            style={{
              fontWeight: 100,
              fontSize: "clamp(22px, 2.8vw, 36px)",
              lineHeight: 1.6,
              color: "var(--color-ink)",
              letterSpacing: "-0.02em",
              borderRight: "3px solid var(--color-sage)",
              paddingRight: "1.5rem",
              fontStyle: "italic",
              margin: "3.5rem 0",
            }}
          >
            «فاصله‌ای بین آنچه می‌گوییم
            <br />و آنچه انجام می‌دهیم هست —
            <br />
            <span
              style={{ color: "var(--color-sage-deep)", fontWeight: 300 }}
            >
              نه از ضعف، بلکه از نبودِ آینه.»
            </span>
          </blockquote>

          {/* بخش ۲ */}
          <div className="prose-hamsoo reveal">
            <p>
              من این را در خودم دیدم.
            </p>
            <p>
              اول ندیدم — یا شاید نخواستم ببینم. آدم‌ها معمولاً ترجیح می‌دهند
              این فاصله را با یک ابزار جدید پُر کنند. با یک اپ. با یک روش.
              با یک سیستم که این‌بار، «حتماً» کار می‌کند.
            </p>
            <p>
              همه‌ی ابزارها را امتحان کردم.
              اپ‌هایی که با استریک و امتیاز و مدال سعی می‌کردند مرا وادار به کاری کنند —
              انگار که انسان‌ها بچه‌هایی هستند که به جایزه نیاز دارند.
              پلنرهایی که برای پُر کردنشان باید بیشتر از خودِ کار انرژی می‌گذاشتم.
              یادداشت‌هایی که بعد از چند هفته تبدیل می‌شدند به انبوهی از قول‌های فراموش‌شده.
            </p>
            <p>
              همه‌شان مشکل یکسانی داشتند: می‌خواستند به‌جای من تصمیم بگیرند.
              می‌خواستند مرا مدیریت کنند، انگیزه بدهند، کنترل کنند.
              هیچ‌کدام فقط یک آینه نبودند.
            </p>
          </div>

          <Ornament />

          {/* بخش ۳ — آینه */}
          <div className="prose-hamsoo reveal">
            <p>
              آینه قضاوت نمی‌کند.
            </p>
            <p>
              وقتی صبح مقابل آینه می‌ایستی و موهایت ژولیده است، آینه نمی‌گوید «بد است.»
              فقط نشان می‌دهد. تصمیم با توست.
            </p>
            <p>
              این همان چیزی بود که می‌خواستم برای تعهدهایم.
              نه یک مربی که بگوید چه کنم. نه یک الگوریتم که «بهترین مسیر» را تجویز کند.
              فقط چیزی که صادقانه نگه‌دارد: «دیروز گفتی این کار را می‌کنی. امروز چه شد؟»
            </p>
            <p>
              نه با لحن سرزنش. نه با ایموجی تشویق. فقط یک پرسش ساده —
              و فضایی برای پاسخ صادقانه. حتی اگر پاسخ «نشد» باشد.
            </p>
            <p>
              به‌خصوص اگر پاسخ «نشد» باشد.
            </p>
          </div>

          {/* pull quote ۲ */}
          <blockquote
            className="reveal my-14"
            style={{
              fontWeight: 100,
              fontSize: "clamp(20px, 2.4vw, 32px)",
              lineHeight: 1.7,
              color: "var(--color-sage-deep)",
              letterSpacing: "-0.015em",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            «همسو برای کسانی ساخته شد که
            <br />
            می‌خواهند با خودشان صادق باشند —
            <br />
            <span style={{ color: "var(--color-stone)", fontWeight: 300 }}>
              نه برای کسانی که نیاز به تشویق دارند.»
            </span>
          </blockquote>

          {/* بخش ۴ — نام */}
          <div className="prose-hamsoo reveal">
            <p>
              اسم را دیر انتخاب کردیم.
            </p>
            <p>
              مدت‌ها دنبال کلمه‌ای می‌گشتیم که هم فارسی باشد، هم چیزی بگوید.
              نه یک اسم «استارتاپی» که انگار از جعبه‌ای پر از حروف بیرون آمده.
              چیزی که خودش یک مفهوم باشد.
            </p>
            <p>
              همسو — در یک مسیر بودن. هم‌جهت. هم‌راستا.
            </p>
            <p>
              نه به معنای کامل بودن. نه به این معنا که هیچ‌وقت گم نشوی.
              بلکه به این معنا که وقتی می‌گویی و وقتی می‌کنی،
              از یک جنس باشند. که جهتت، جهتِ حرفت باشد.
            </p>
            <p>
              این ساده به نظر می‌رسد. اما برای اکثر ما — برای من — ساده نبود.
            </p>
          </div>

          <Ornament />

          {/* بخش ۵ — امروز */}
          <div className="prose-hamsoo reveal">
            <p>
              همسو ساخته شد برای آن لحظه‌ای که با خودت تنها هستی.
            </p>
            <p>
              نه لحظه‌ای که جلوی دیگران هستی و باید موفق به نظر برسی.
              نه لحظه‌ای که انگیزه داری و همه‌چیز روشن است.
              بلکه آن لحظه‌ی ساکت که می‌دانی دیروز چی گفتی —
              و می‌خواهی بدانی واقعاً چی شد.
            </p>
            <p>
              در آن لحظه، همسو فقط یک چیز می‌پرسد.
            </p>
            <p>
              و تو باید جواب بدهی — نه به همسو، بلکه به خودت.
            </p>
          </div>

          {/* جمله پایانی */}
          <div
            className="reveal mt-16 p-8 md:p-12 rounded-3xl text-center"
            style={{
              background: "rgba(122,132,113,0.06)",
              border: "1px solid rgba(122,132,113,0.12)",
            }}
          >
            <p
              style={{
                fontWeight: 100,
                fontSize: "clamp(26px, 3.5vw, 48px)",
                lineHeight: 1.4,
                letterSpacing: "-0.025em",
                color: "var(--color-ink)",
                fontStyle: "italic",
              }}
            >
              «آنچه می‌گویی،
              <br />
              <span
                style={{ color: "var(--color-sage-deep)", fontWeight: 300 }}
              >
                همان شو.»
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-20 px-6 lg:px-10">
        <div className="max-w-2xl mx-auto reveal">
          <div
            className="glass-strong rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
            style={{
              boxShadow:
                "0 24px 64px rgba(46,44,40,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
          >
            <div>
              <p
                style={{
                  fontWeight: 300,
                  fontSize: "20px",
                  color: "var(--color-ink)",
                  marginBottom: "6px",
                }}
              >
                می‌خواهی شروع کنی؟
              </p>
              <p
                className="text-stone"
                style={{ fontWeight: 300, fontSize: "15px" }}
              >
                یک تعهد. فردا یک پرسش. همین.
              </p>
            </div>
            <Link href="/login" className="btn btn-primary shrink-0">
              شروع کن — رایگان
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: "scaleX(-1)" }}
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
