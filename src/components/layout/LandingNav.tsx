"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LandingNav — ناوبریِ یکدستِ صفحاتِ قبل از ورود
// لینک‌ها در همهٔ صفحات یکسان‌اند: صفحه اصلی · درباره ما · تماس با ما · بلاگ.
// دکمهٔ تم همیشه آخرین آیتمِ گوشهٔ چپ-بالا است (بعد از «شروع کن»).
// client component برای تشخیصِ صفحهٔ فعال (usePathname).
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface Props {
  /** فقط برای سازگاری با CmsPageShell — لینک‌ها در همهٔ صفحات یکسان‌اند. */
  landing?: boolean;
}

const NAV_LINKS = [
  { href: "/", label: "صفحه اصلی" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
  { href: "/blog", label: "بلاگ" },
] as const;

export function LandingNav({ landing: _landing = false }: Props) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="glass-nav fixed top-0 inset-x-0 z-50 anim-fade-in">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.png" alt="همسو"
            width={68} height={44}
            style={{ height: "44px", width: "auto" }}
            priority
          />
        </Link>

        <div className="nav-links flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-4 py-2 rounded-full text-sm transition-all duration-300
                  ${active ? "text-ink font-medium" : "text-stone font-normal hover:text-ink hover:bg-black/5"}`}
              >
                {label}
                <span
                  aria-hidden
                  className={`absolute -bottom-px left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-ember/70
                    transition-all duration-500 ease-expo
                    ${active ? "w-5 opacity-100" : "w-0 opacity-0"}`}
                />
              </Link>
            );
          })}
        </div>

        {/* چپ: «شروع کن» و در انتها (گوشهٔ چپ) دکمهٔ تم */}
        <div className="flex items-center gap-2.5">
          <Link href="/login" className="btn btn-primary" style={{ padding: ".65rem 1.25rem", fontSize: "14px" }}>
            شروع کن
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
