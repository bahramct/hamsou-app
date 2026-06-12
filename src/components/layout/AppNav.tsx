"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AppNav — نوار ناوبری یکپارچه همه صفحات authenticated
// Client Component (usePathname برای تشخیص صفحه فعال)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "داشبورد" },
  { href: "/history", label: "تاریخچه" },
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

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2 13c0-2.485 2.463-4.5 5.5-4.5S13 10.515 13 13"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
      />
    </svg>
  );
}

function Hamburger({ open }: { open: boolean }) {
  return (
    <div className="w-5 flex flex-col gap-1.25" aria-hidden>
      <span
        className={`block h-px w-full bg-current transition-all duration-300 origin-center
          ${open ? "translate-y-1.5 rotate-45" : ""}`}
      />
      <span
        className={`block h-px w-full bg-current transition-all duration-300
          ${open ? "opacity-0 scale-x-50" : ""}`}
      />
      <span
        className={`block h-px w-full bg-current transition-all duration-300 origin-center
          ${open ? "-translate-y-1.5 -rotate-45" : ""}`}
      />
    </div>
  );
}

export function AppNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = useIsActive();

  return (
    <nav className="glass-nav sticky top-0 z-40">
      {/* ─── نوار اصلی ─── */}
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

        {/* لوگو — راست (RTL start) */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 shrink-0 hover:opacity-70 transition-opacity duration-200"
        >
          <Image
            src="/logo.png"
            width={58}
            height={38}
            alt="همسو"
            style={{ width: "auto", height: "38px" }}
          />
        </Link>

        {/* آیتم‌های ناوبری — مرکز (دسکتاپ) */}
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
                {/* خطِ زیرینِ انیمیشنی — رشد از مرکز هنگام active */}
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

        {/* سمت چپ: ناقوس + پروفایل + خروج (دسکتاپ) و همبرگر (موبایل)؛ تم همیشه آخر (گوشهٔ چپ) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* ناقوس اعلان — همیشه نمایان (دسکتاپ + موبایل) */}
          <NotificationBell />

          {/* پروفایل */}
          <Link
            href="/settings/profile"
            className={`
              hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-250
              ${isActive("/settings/profile")
                ? "text-ink font-medium bg-black/6"
                : "text-stone hover:text-ink hover:bg-black/4"
              }
            `}
          >
            <UserIcon />
            <span className="hidden lg:inline">پروفایل</span>
          </Link>

          {/* خروج */}
          <form action="/api/auth/logout" method="POST" className="hidden md:block">
            <button
              type="submit"
              className="px-3 py-2 rounded-xl text-sm text-stone hover:text-ember hover:bg-ember/6 transition-all duration-250"
            >
              خروج
            </button>
          </form>

          {/* همبرگر — موبایل */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-black/5 transition-colors text-stone"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
            aria-expanded={menuOpen}
          >
            <Hamburger open={menuOpen} />
          </button>

          {/* تم روشن/تاریک — آخرین آیتم (گوشهٔ چپ-بالا) */}
          <ThemeToggle className="mr-1" />
        </div>
      </div>

      {/* ─── منوی موبایل — slide down ─── */}
      <div
        className={`
          md:hidden overflow-hidden
          transition-[max-height,opacity] duration-300 ease-in-out
          border-t border-black/5
          ${menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}
        `}
      >
        <div className="px-4 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200
                  ${active ? "text-ink font-medium bg-black/6" : "text-stone hover:text-ink hover:bg-black/4"}
                `}
              >
                {label}
                {active && <span className="w-1.5 h-1.5 rounded-full bg-ember/75 shrink-0" />}
              </Link>
            );
          })}

          <div className="h-px bg-black/6 my-1" />

          <Link
            href="/settings/profile"
            onClick={() => setMenuOpen(false)}
            className={`
              flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm transition-all duration-200
              ${isActive("/settings/profile") ? "text-ink font-medium bg-black/6" : "text-stone hover:text-ink hover:bg-black/4"}
            `}
          >
            <UserIcon />
            پروفایل
          </Link>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center px-4 py-3 rounded-xl text-sm text-stone hover:text-ember hover:bg-ember/6 transition-all duration-200"
            >
              خروج از حساب
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
