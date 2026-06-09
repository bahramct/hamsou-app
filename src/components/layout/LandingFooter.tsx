import Image from "next/image";
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer
      className="relative z-10 px-6 lg:px-10 pt-16 pb-10"
      style={{ borderTop: "1px solid rgba(26,26,31,0.06)" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">

          {/* برند */}
          <div>
            <Image
              src="/logo.png" alt="همسو"
              width={40} height={40}
              className="h-10 w-auto mb-4"
              style={{ width: "auto", height: "auto" }}
            />
            <p className="text-stone" style={{ fontWeight: 300, fontSize: "14px", lineHeight: 1.7, maxWidth: "280px" }}>
              آینه‌ای آرام برای کلماتت. برای واقعی‌تر زندگی کردن.
            </p>
          </div>

          {/* محصول */}
          <div>
            <div className="text-fog text-xs uppercase tracking-[0.18em] mb-4" style={{ fontWeight: 600 }}>محصول</div>
            <ul className="space-y-3 text-stone text-sm" style={{ fontWeight: 300 }}>
              <li><a href="/#solution" className="hover:text-ink transition-colors">چطور کار می‌کند</a></li>
              <li><a href="/#difference" className="hover:text-ink transition-colors">آنچه همسو نیست</a></li>
              <li><Link href="/blog" className="hover:text-ink transition-colors">بلاگ</Link></li>
            </ul>
          </div>

          {/* برند / صفحات */}
          <div>
            <div className="text-fog text-xs uppercase tracking-[0.18em] mb-4" style={{ fontWeight: 600 }}>برند</div>
            <ul className="space-y-3 text-stone text-sm" style={{ fontWeight: 300 }}>
              <li><Link href="/about" className="hover:text-ink transition-colors">درباره ما</Link></li>
              <li><Link href="/story" className="hover:text-ink transition-colors">داستان همسو</Link></li>
              <li><Link href="/privacy" className="hover:text-ink transition-colors">حریم خصوصی</Link></li>
              <li><Link href="/contact" className="hover:text-ink transition-colors">تماس با ما</Link></li>
            </ul>
          </div>

          {/* اعتماد */}
          <div className="flex flex-col items-start">
            <div className="text-fog text-xs uppercase tracking-[0.18em] mb-4" style={{ fontWeight: 600 }}>اعتماد</div>
            <div
              dangerouslySetInnerHTML={{
                __html: `<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=741289&Code=6NTv9eYWnDK4uTnjWHuHnead8qkxgg9L'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=741289&Code=6NTv9eYWnDK4uTnjWHuHnead8qkxgg9L' alt='' style='cursor:pointer' code='6NTv9eYWnDK4uTnjWHuHnead8qkxgg9L'></a>`,
              }}
            />
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
