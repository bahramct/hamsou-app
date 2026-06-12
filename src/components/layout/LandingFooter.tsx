import Link from "next/link";
import { SocialLinks } from "@/components/layout/SocialLinks";
import { TrustBadges } from "@/components/layout/TrustBadges";

// ─────────────────────────────────────────────────────────────────────────────
// LandingFooter — فوتر سایت: ۴ ستون (راست به چپ):
// ۱) برند: لوگو + «آیینه‌ای، برای واقعی‌تر کردن زندگی» + شبکه‌های اجتماعی
// ۲) محصول: چطور کار می‌کند · آنچه همسو نیست · کاربران (anchorهای لندینگ)
// ۳) لینک‌های مفید: داستان همسو · درباره ما · تماس با ما · حریم خصوصی
// ۴) مجوزها: نماد اعتماد + زرین‌پال (هم‌سایز، کنار هم)
// ─────────────────────────────────────────────────────────────────────────────

function ColTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-fog text-xs uppercase tracking-[0.18em] mb-4" style={{ fontWeight: 600 }}>
      {children}
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer
      className="relative z-10 px-6 lg:px-10 pt-16 pb-10"
      style={{ borderTop: "1px solid rgba(var(--rgb-line),0.06)" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">

          {/* ۱) برند + سوشال */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png" alt="همسو"
              className="mb-4"
              style={{ height: "50px", width: "auto" }}
            />
            <p className="text-stone mb-5" style={{ fontWeight: 300, fontSize: "14px", lineHeight: 1.7, maxWidth: "280px" }}>
              آیینه‌ای، برای واقعی‌تر کردن زندگی
            </p>
            <SocialLinks />
          </div>

          {/* ۲) محصول */}
          <div>
            <ColTitle>محصول</ColTitle>
            <ul className="space-y-3 text-stone text-sm" style={{ fontWeight: 300 }}>
              <li><a href="/#solution" className="hover:text-ink transition-colors">چطور کار می‌کند</a></li>
              <li><a href="/#difference" className="hover:text-ink transition-colors">آنچه همسو نیست</a></li>
              <li><a href="/#testimonial" className="hover:text-ink transition-colors">کاربران</a></li>
            </ul>
          </div>

          {/* ۳) لینک‌های مفید */}
          <div>
            <ColTitle>لینک‌های مفید</ColTitle>
            <ul className="space-y-3 text-stone text-sm" style={{ fontWeight: 300 }}>
              <li><Link href="/story" className="hover:text-ink transition-colors">داستان همسو</Link></li>
              <li><Link href="/about" className="hover:text-ink transition-colors">درباره ما</Link></li>
              <li><Link href="/contact" className="hover:text-ink transition-colors">تماس با ما</Link></li>
              <li><Link href="/privacy" className="hover:text-ink transition-colors">حریم خصوصی</Link></li>
            </ul>
          </div>

          {/* ۴) مجوزها */}
          <div>
            <ColTitle>مجوزها</ColTitle>
            <TrustBadges />
          </div>
        </div>

        <hr className="hr-line mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-fog text-xs fa-num" style={{ fontWeight: 300 }}>© ۱۴۰۵ همسو · کلیه حقوق محفوظ است.</p>
          <p className="text-fog text-xs" style={{ fontWeight: 300, fontStyle: "italic" }}>«آنچه می‌گویی، همان شو.»</p>
        </div>
      </div>
    </footer>
  );
}
