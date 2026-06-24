"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AppNav — ناوبری یکپارچه همه صفحات authenticated (DECISION-117)
// • دسکتاپ (md+): نوارِ بالا با ناوبریِ افقیِ مرکز + پروفایل/خروج (مثل قبل).
// • موبایل (<md): نوارِ بالا فقط برند + ناقوس + تم؛ ناوبریِ اصلی به «نوارِ تبِ
//   پایین» (bottom-tab، شست‌محور) منتقل شد — مطابق ماکاپِ تأییدشده و مرجعِ همیار.
//   همبرگر/منوی کشویی حذف شد. خروجِ موبایل به‌صورتِ آیکونِ کوچک در نوارِ بالا.
// Client Component (usePathname برای تشخیص صفحه فعال)
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "داشبورد" },
  { href: "/goal", label: "برنامه‌ریزی و چالش" },
  { href: "/reports/weekly", label: "گزارش هفتگی" },
  { href: "/plans", label: "پلن‌ها" },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/reports/weekly") return pathname.startsWith("/reports");
    if (href === "/settings/profile") return pathname.startsWith("/settings");
    return pathname.startsWith(href);
  };
}

// ─── آیکون‌ها ─────────────────────────────────────────────────────────────────
function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function RouteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" />
      <path d="M8 19h7a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h7" />
    </svg>
  );
}
function HamyarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  );
}
function ReportIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 13c0-2.485 2.463-4.5 5.5-4.5S13 10.515 13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
    </svg>
  );
}

export function AppNav() {
  const isActive = useIsActive();

  return (
    <>
      {/* ═══════════ نوارِ بالا ═══════════ */}
      <nav className="glass-nav sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

          {/* لوگو — راست (RTL start) */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 shrink-0 hover:opacity-70 transition-opacity duration-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="همسو" style={{ width: "auto", height: "38px" }} />
          </Link>

          {/* آیتم‌های ناوبری — مرکز (فقط دسکتاپ) */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative px-4 py-2 rounded-xl text-sm transition-colors duration-300 ease-expo
                    ${active
                      ? "text-ink font-medium"
                      : "text-stone font-normal hover:text-ink hover:bg-black/3"
                    }`}
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

          {/* سمت چپ: ناقوس + (دسکتاپ) پروفایل/خروج + (موبایل) خروجِ آیکونی؛ تم آخر */}
          <div className="flex items-center gap-1 shrink-0">
            <NotificationBell />

            {/* پروفایل — فقط دسکتاپ (موبایل تبِ پروفایل دارد) */}
            <Link
              href="/settings/profile"
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-250 text-stone hover:text-ink hover:bg-black/4"
            >
              <UserIcon />
              <span className="hidden lg:inline">پروفایل</span>
            </Link>

            {/* خروج — دسکتاپ (متن) */}
            <form action="/api/auth/logout" method="POST" className="hidden md:block">
              <button
                type="submit"
                className="px-3 py-2 rounded-xl text-sm text-stone hover:text-ember hover:bg-ember/6 transition-all duration-250"
              >
                خروج
              </button>
            </form>

            {/* خروج — موبایل (آیکون) تا با حذفِ منوی همبرگری دسترسی از دست نرود */}
            <form action="/api/auth/logout" method="POST" className="md:hidden">
              <button
                type="submit"
                className="p-2 rounded-xl text-stone hover:text-ember hover:bg-ember/6 transition-colors"
                aria-label="خروج از حساب"
              >
                <LogoutIcon />
              </button>
            </form>

            {/* تم روشن/تاریک/ایندیگو — آخرین آیتم (ایندیگو فقط در اپ — DECISION-128) */}
            <ThemeToggle className="mr-1" allowIndigo />
          </div>
        </div>
      </nav>

      {/* ═══════════ نوارِ تبِ پایینِ یکپارچه — موبایل (DECISION-119؛ سبکِ همیار) ═══════════
          راست→چپ: مسیر · گزارش · [خانه = مرکزِ برجسته] · همیار(به‌زودی) · پروفایل */}
      <nav aria-label="ناوبری اصلی" className="app-botnav md:hidden">
        {/* مسیر (goal) — راست‌ترین */}
        <Link href="/goal" aria-current={isActive("/goal") ? "page" : undefined}
          className={`app-bn ${isActive("/goal") ? "active" : ""}`}>
          <RouteIcon /><span>مسیر</span>
        </Link>

        {/* گزارش */}
        <Link href="/reports/weekly" aria-current={isActive("/reports/weekly") ? "page" : undefined}
          className={`app-bn ${isActive("/reports/weekly") ? "active" : ""}`}>
          <ReportIcon /><span>گزارش</span>
        </Link>

        {/* خانه — مرکزِ برجسته */}
        <Link href="/dashboard" aria-current={isActive("/dashboard") ? "page" : undefined}
          className={`app-bn app-bn-home ${isActive("/dashboard") ? "active" : ""}`}>
          <span className="bn-ring"><HomeIcon /></span><span>خانه</span>
        </Link>

        {/* همیار — به‌زودی (غیرفعال تا ساختِ شبکهٔ اجتماعی) */}
        <button type="button" className="app-bn is-disabled" disabled aria-disabled="true" aria-label="همیار — به‌زودی">
          <span className="bn-soon">به‌زودی</span>
          <HamyarIcon /><span>همیار</span>
        </button>

        {/* پروفایل — چپ‌ترین */}
        <Link href="/settings/profile" aria-current={isActive("/settings/profile") ? "page" : undefined}
          className={`app-bn ${isActive("/settings/profile") ? "active" : ""}`}>
          <ProfileIcon /><span>پروفایل</span>
        </Link>
      </nav>
    </>
  );
}
