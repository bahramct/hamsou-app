// ─────────────────────────────────────────────────────────────────────────────
// /admin/support — صندوق تیکت‌های پشتیبانی (DECISION-044) — enforce: support.read
// فیلتر وضعیت/اولویت/دسته + جستجوی موضوع + صفحه‌بندی. پاسخ در صفحهٔ جزئیات.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth-server";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { prisma } from "@/lib/db/client";
import {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
  Statuses,
  Priorities,
  Categories,
  OPEN_STATUSES,
} from "@/lib/support/tickets";
import { StatusBadge, PriorityBadge } from "@/components/features/support/badges";
import { toFaDigits } from "@/lib/utils/digits";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function toFa(n: number): string {
  return n.toLocaleString("fa-IR");
}
function faDateTime(d: Date): string {
  return d.toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tehran" });
}

interface SP {
  status?: string; priority?: string; category?: string; q?: string; page?: string;
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requirePermission("support.read");

  const sp = await searchParams;
  const statusF = Statuses.is(sp.status ?? "") ? sp.status! : "";
  const priorityF = Priorities.is(sp.priority ?? "") ? sp.priority! : "";
  const categoryF = Categories.is(sp.category ?? "") ? sp.category! : "";
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(statusF ? { status: statusF } : {}),
    ...(priorityF ? { priority: priorityF } : {}),
    ...(categoryF ? { category: categoryF } : {}),
    ...(q ? { subject: { contains: q } } : {}),
  };

  const [total, openCount, tickets] = await Promise.all([
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.count({ where: { status: { in: [...OPEN_STATUSES] } } }),
    prisma.supportTicket.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, subject: true, category: true, status: true, priority: true, lastMessageAt: true,
        user: { select: { displayName: true, phone: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = Boolean(statusF || priorityF || categoryF || q);

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (statusF) params.set("status", statusF);
    if (priorityF) params.set("priority", priorityF);
    if (categoryF) params.set("category", categoryF);
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/admin/support?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={10_000} />
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-ink">تیکت‌های پشتیبانی</h1>
          <p className="text-sm text-stone mt-1 fa-num">
            {toFa(total)} تیکت{hasFilter ? " (با فیلتر)" : ""} · {toFa(openCount)} باز
          </p>
        </div>
      </header>

      {/* فیلترها */}
      <form method="GET" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 items-end">
        <Labeled label="وضعیت">
          <select name="status" defaultValue={statusF} className={ctrl}>
            <option value="">همه</option>
            {TICKET_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Labeled>
        <Labeled label="اولویت">
          <select name="priority" defaultValue={priorityF} className={ctrl}>
            <option value="">همه</option>
            {TICKET_PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </Labeled>
        <Labeled label="دسته">
          <select name="category" defaultValue={categoryF} className={ctrl}>
            <option value="">همه</option>
            {TICKET_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Labeled>
        <Labeled label="جستجوی موضوع">
          <input name="q" defaultValue={q} placeholder="موضوع…" className={ctrl} />
        </Labeled>
        <div className="flex items-center gap-2">
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors">فیلتر</button>
          {hasFilter && (
            <Link href="/admin/support" className="px-3 py-2.5 rounded-xl text-sm text-stone hover:text-ink hover:bg-black/4 transition-colors">پاک</Link>
          )}
        </div>
      </form>

      {/* جدول */}
      {tickets.length === 0 ? (
        <p className="text-sm text-fog italic py-12 text-center">تیکتی یافت نشد.</p>
      ) : (
        <div className="rounded-2xl border border-black/8 bg-white/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/6 text-[11px] text-fog">
                <th className="text-right font-medium px-4 py-3">موضوع</th>
                <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">کاربر</th>
                <th className="text-right font-medium px-4 py-3">وضعیت</th>
                <th className="text-right font-medium px-4 py-3 hidden md:table-cell">اولویت</th>
                <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">آخرین پیام</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-black/4 last:border-0 hover:bg-black/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-ink truncate max-w-xs">{t.subject}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-fog">{Categories.label(t.category)}</span>
                      <span className="text-[10px] text-fog fa-num">· {toFa(t._count.messages)} پیام</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="text-stone text-xs">{t.user.displayName || "—"}</div>
                    <div className="text-[10px] text-fog num-latin" dir="ltr">
                      {t.user.phone ? toFaDigits(t.user.phone) : t.user.email ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3 text-fog text-xs hidden lg:table-cell fa-num">{faDateTime(t.lastMessageAt)}</td>
                  <td className="px-4 py-3 text-left">
                    <Link href={`/admin/support/${t.id}`} className="text-xs text-ember hover:underline">باز کردن</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && <Link href={pageHref(page - 1)} className="px-3 py-1.5 rounded-lg text-sm text-stone hover:bg-black/4 transition-colors">قبلی</Link>}
          <span className="text-xs text-fog fa-num">صفحه {toFa(page)} از {toFa(totalPages)}</span>
          {page < totalPages && <Link href={pageHref(page + 1)} className="px-3 py-1.5 rounded-lg text-sm text-stone hover:bg-black/4 transition-colors">بعدی</Link>}
        </div>
      )}
    </div>
  );
}

const ctrl = "w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink focus:outline-none focus:border-sage";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-stone">{label}</label>
      {children}
    </div>
  );
}
