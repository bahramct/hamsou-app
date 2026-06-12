"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AdminShell — قالب پنل مدیریت (sidebar + header)
// nav بر اساس permissionهای ادمین فیلتر می‌شود (DECISION-036).
// ماژول‌های آینده با برچسب «به‌زودی» و غیرفعال نمایش داده می‌شوند تا نقشه راه
// روشن باشد بدون لینک شکسته.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AVATAR_COLOR } from "@/lib/profile/avatarPresets";
import { toFaDigits as toFa } from "@/lib/utils/digits";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type BadgeKey = "tickets" | "chat" | "payments" | "comments" | "contacts";

interface NavItem {
  href: string;
  label: string;
  perm: string;
  icon: keyof typeof ICONS;
  ready: boolean;
  badge?: BadgeKey;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "داشبورد", perm: "dashboard.view", icon: "grid", ready: true },
  { href: "/admin/users", label: "کاربران", perm: "users.read", icon: "users", ready: true },
  { href: "/admin/plans", label: "پلن‌ها", perm: "plans.read", icon: "card", ready: true },
  { href: "/admin/ai", label: "هوش مصنوعی", perm: "ai.read", icon: "spark", ready: true },
  { href: "/admin/sms", label: "پیامک", perm: "sms.read", icon: "message", ready: true },
  { href: "/admin/email", label: "ایمیل", perm: "email.read", icon: "email", ready: true },
  { href: "/admin/payment", label: "پرداخت", perm: "payment.read", icon: "wallet", ready: true, badge: "payments" },
  { href: "/admin/support", label: "تیکت‌ها", perm: "support.read", icon: "headset", ready: true, badge: "tickets" },
  { href: "/admin/livechat", label: "چت آنلاین", perm: "support.read", icon: "chat", ready: true, badge: "chat" },
  { href: "/admin/contact", label: "پیام‌های تماس", perm: "support.read", icon: "inbox", ready: true, badge: "contacts" },
  { href: "/admin/blog", label: "بلاگ", perm: "blog.read", icon: "book", ready: true, badge: "comments" },
  { href: "/admin/admins", label: "ادمین‌ها", perm: "admins.manage", icon: "shield", ready: true },
  { href: "/admin/roles", label: "نقش‌ها و دسترسی‌ها", perm: "roles.manage", icon: "key", ready: true },
  { href: "/admin/audit", label: "لاگ ممیزی", perm: "audit.read", icon: "list", ready: true },
];

interface NavCounts {
  openTickets: number;
  unreadChats: number;
  pendingPayments: number;
  pendingComments: number;
  newContacts: number;
}

const COUNTS_POLL_MS = 20000;

interface Props {
  admin: { displayName: string; username: string; avatarPreset: number; avatarImage: string | null };
  role: { label: string };
  permissions: string[];
  initialCounts: NavCounts;
  children: React.ReactNode;
}

export function AdminShell({ admin, role, permissions, initialCounts, children }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState<NavCounts>(initialCounts);
  const permSet = new Set(permissions);
  const visible = NAV_ITEMS.filter((i) => permSet.has(i.perm));
  const canSeeBadges = permSet.has("support.read") || permSet.has("payment.read") || permSet.has("blog.moderate");

  // poll آرامِ شمارهٔ badgeها (تیکت باز + چت خوانده‌نشده + شارژ در انتظار)
  const refreshCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/nav-counts", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok) setCounts({
        openTickets: data.openTickets ?? 0,
        unreadChats: data.unreadChats ?? 0,
        pendingPayments: data.pendingPayments ?? 0,
        pendingComments: data.pendingComments ?? 0,
        newContacts: data.newContacts ?? 0,
      });
    } catch {
      // بی‌صدا
    }
  }, []);

  useEffect(() => {
    if (!canSeeBadges) return;
    const t = setInterval(() => {
      if (!document.hidden) void refreshCounts();
    }, COUNTS_POLL_MS);
    const onVisible = () => { if (!document.hidden) void refreshCounts(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVisible); };
  }, [canSeeBadges, refreshCounts]);

  const badgeValue = (key?: BadgeKey): number =>
    key === "tickets" ? counts.openTickets
      : key === "chat" ? counts.unreadChats
      : key === "payments" ? counts.pendingPayments
      : key === "comments" ? counts.pendingComments
      : key === "contacts" ? counts.newContacts
      : 0;

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {visible.map((item) => {
        const active = isActive(item.href);
        if (!item.ready) {
          return (
            <div
              key={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-fog/70 cursor-default select-none"
              title="به‌زودی"
            >
              <Icon name={item.icon} />
              <span className="flex-1">{item.label}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/4 text-fog">به‌زودی</span>
            </div>
          );
        }
        const count = badgeValue(item.badge);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              active
                ? "bg-ink text-paper font-medium"
                : "text-stone hover:text-ink hover:bg-black/4"
            }`}
          >
            <Icon name={item.icon} />
            <span className="flex-1">{item.label}</span>
            {count > 0 && (
              <span
                className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center fa-num shrink-0 ${
                  active ? "bg-paper/25 text-paper" : "bg-ember text-paper"
                }`}
              >
                {count > 99 ? toFa(99) + "+" : toFa(count)}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-paper flex">
      {/* ───── Sidebar (دسکتاپ) ───── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-l border-black/6 bg-white/40 backdrop-blur-sm sticky top-0 h-dvh">
        <div className="px-5 h-16 flex items-center gap-2.5 border-b border-black/6">
          <div className="w-7 h-7 rounded-lg bg-ink text-paper flex items-center justify-center text-xs">ه</div>
          <div className="flex flex-col leading-tight flex-1">
            <span className="text-sm font-semibold text-ink">همسو</span>
            <span className="text-[10px] text-fog">پنل مدیریت</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
        <AdminUserCard admin={admin} role={role} />
      </aside>

      {/* ───── ناحیه اصلی ───── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* header موبایل */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-black/6 bg-white/60 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-ink text-paper flex items-center justify-center text-[10px]">ه</div>
            <span className="text-sm font-semibold text-ink">پنل مدیریت</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="منو"
              className="p-2 rounded-lg hover:bg-black/5 text-stone"
            >
              <Icon name={mobileOpen ? "close" : "menu"} />
            </button>
          </div>
        </header>

        {/* منوی موبایل */}
        {mobileOpen && (
          <div className="md:hidden border-b border-black/6 bg-white/70 backdrop-blur-sm px-3 py-3">
            {nav}
            <div className="mt-2 pt-2 border-t border-black/6">
              <AdminUserCard admin={admin} role={role} compact />
            </div>
          </div>
        )}

        <main className="flex-1 px-5 md:px-8 py-6 md:py-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── کارت ادمین (لینک به پروفایل) + خروج ────────────────────────────────────
function AdminUserCard({
  admin,
  role,
  compact = false,
}: {
  admin: { displayName: string; username: string; avatarPreset: number; avatarImage: string | null };
  role: { label: string };
  compact?: boolean;
}) {
  const preset = AVATAR_COLOR;
  return (
    <div className={`${compact ? "" : "border-t border-black/6"} px-4 py-3 flex items-center gap-3`}>
      <Link
        href="/admin/profile"
        className="flex items-center gap-3 flex-1 min-w-0 rounded-lg hover:bg-black/4 -mx-1 px-1 py-0.5 transition-colors"
        title="پروفایل من"
      >
        <div
          className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold shrink-0"
          style={admin.avatarImage ? {} : { backgroundColor: preset.bg, color: preset.fg }}
        >
          {admin.avatarImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={admin.avatarImage} alt="آواتار" className="w-full h-full object-cover" />
          ) : (
            admin.displayName.slice(0, 1)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-ink truncate">{admin.displayName}</div>
          <div className="text-[10px] text-fog">{role.label}</div>
        </div>
      </Link>
      <form action="/api/admin/auth/logout" method="POST">
        <button
          type="submit"
          className="p-1.5 rounded-lg text-stone hover:text-ember hover:bg-ember/6 transition-colors"
          aria-label="خروج"
          title="خروج"
        >
          <Icon name="logout" />
        </button>
      </form>
    </div>
  );
}

// ─── آیکون‌ها ─────────────────────────────────────────────────────────────────
function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      {ICONS[name]}
    </svg>
  );
}

const S = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

const ICONS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" {...S} /><rect x="14" y="3" width="7" height="7" rx="1.5" {...S} /><rect x="3" y="14" width="7" height="7" rx="1.5" {...S} /><rect x="14" y="14" width="7" height="7" rx="1.5" {...S} /></>,
  users: <><circle cx="9" cy="8" r="3" {...S} /><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" {...S} /><path d="M16 6a3 3 0 0 1 0 6M21 20c0-2.4-1.5-4.2-4-4.8" {...S} /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2.5" {...S} /><path d="M3 10h18" {...S} /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" {...S} /></>,
  message: <><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.8A8 8 0 1 1 21 12z" {...S} /></>,
  email: <><rect x="2" y="4" width="20" height="16" rx="2" {...S} /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" {...S} /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2.5" {...S} /><path d="M16 12h3" {...S} /></>,
  headset: <><path d="M4 13v-1a8 8 0 0 1 16 0v1" {...S} /><rect x="3" y="13" width="4" height="6" rx="1.5" {...S} /><rect x="17" y="13" width="4" height="6" rx="1.5" {...S} /></>,
  chat: <><path d="M21 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.4A8 8 0 1 1 21 11.5z" {...S} /><path d="M8.5 11h7M8.5 14h4" {...S} /></>,
  doc: <><path d="M6 3h8l5 5v13a0 0 0 0 1 0 0H6a0 0 0 0 1 0 0z" {...S} /><path d="M14 3v5h5" {...S} /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" {...S} /><path d="M19 17H6a2 2 0 0 0-2 2" {...S} /><path d="M9 7h6M9 10h6" {...S} /></>,
  shield: <><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" {...S} /></>,
  key: <><circle cx="8" cy="8" r="4" {...S} /><path d="M11 11l8 8M16 16l2-2M18 18l2-2" {...S} /></>,
  list: <><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" {...S} /></>,
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" {...S} /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" {...S} /></>,
  logout: <><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11" {...S} /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" {...S} /></>,
  close: <><path d="M6 6l12 12M18 6L6 18" {...S} /></>,
};
