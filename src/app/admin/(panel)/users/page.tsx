// ─────────────────────────────────────────────────────────────────────────────
// /admin/users — لیست کاربران + جستجو با شماره + فیلتر پلن (enforce: users.read)
// حریم خصوصی (DECISION-026 §۷): محتوای تعهد نمایش داده نمی‌شود؛ فقط متادیتا.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { USER_PLANS, type UserPlan } from "@/constants/plans";
import { toFaDigits } from "@/lib/utils/digits";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = { FREE: "رایگان", PLUS: "پلاس", PRO: "پرو" };
const PAGE_SIZE = 25;

function toFa(n: number): string {
  return n.toLocaleString("fa-IR");
}

function faDate(d: Date): string {
  return d.toLocaleDateString("fa-IR", { dateStyle: "medium", timeZone: "Asia/Tehran" });
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; page?: string }>;
}) {
  await requirePermission("users.read");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const planFilter = USER_PLANS.includes(sp.plan as UserPlan) ? (sp.plan as UserPlan) : undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(q ? { phone: { contains: q } } : {}),
    ...(planFilter ? { plan: planFilter } : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        phone: true,
        email: true,
        displayName: true,
        plan: true,
        isBanned: true,
        createdAt: true,
        _count: { select: { entries: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (planFilter) params.set("plan", planFilter);
    params.set("page", String(p));
    return `/admin/users?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-ink">کاربران</h1>
          <p className="text-sm text-stone mt-1 fa-num">{toFa(total)} کاربر</p>
        </div>
      </header>

      {/* جستجو + فیلتر */}
      <form method="GET" className="flex items-center gap-2 flex-wrap">
        <input
          name="q"
          defaultValue={q}
          placeholder="جستجو با شماره موبایل…"
          dir="ltr"
          className="flex-1 min-w-48 rounded-xl px-4 py-2.5 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog text-right focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
        />
        <select
          name="plan"
          defaultValue={planFilter ?? ""}
          className="rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink focus:outline-none focus:border-sage"
        >
          <option value="">همه پلن‌ها</option>
          {USER_PLANS.map((p) => (
            <option key={p} value={p}>{PLAN_LABELS[p]}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
        >
          جستجو
        </button>
        {(q || planFilter) && (
          <Link href="/admin/users" className="px-3 py-2.5 rounded-xl text-sm text-stone hover:text-ink hover:bg-black/4 transition-colors">
            پاک کردن
          </Link>
        )}
      </form>

      {/* جدول */}
      {users.length === 0 ? (
        <p className="text-sm text-fog italic py-12 text-center">کاربری یافت نشد.</p>
      ) : (
        <div className="rounded-2xl border border-black/8 bg-white/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/6 text-[11px] text-fog">
                <th className="text-right font-medium px-4 py-3">شماره</th>
                <th className="text-right font-medium px-4 py-3 hidden sm:table-cell">نام</th>
                <th className="text-right font-medium px-4 py-3">پلن</th>
                <th className="text-right font-medium px-4 py-3 hidden md:table-cell">تعهدها</th>
                <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">عضویت</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-black/4 last:border-0 hover:bg-black/2 transition-colors">
                  <td className="px-4 py-3 text-ink fa-num" dir="ltr">
                    <div className="flex items-center gap-2 justify-end">
                      {u.isBanned && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-ember/12 text-ember">مسدود</span>
                      )}
                      <span className={u.phone ? "" : "num-latin"}>
                        {u.phone ? toFaDigits(u.phone) : u.email ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone hidden sm:table-cell">{u.displayName || "—"}</td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={u.plan} />
                  </td>
                  <td className="px-4 py-3 text-stone fa-num hidden md:table-cell">{toFa(u._count.entries)}</td>
                  <td className="px-4 py-3 text-fog text-xs hidden lg:table-cell fa-num">{faDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-left">
                    <Link href={`/admin/users/${u.id}`} className="text-xs text-ember hover:underline">
                      جزئیات
                    </Link>
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
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="px-3 py-1.5 rounded-lg text-sm text-stone hover:bg-black/4 transition-colors">قبلی</Link>
          )}
          <span className="text-xs text-fog fa-num">صفحه {toFa(page)} از {toFa(totalPages)}</span>
          {page < totalPages && (
            <Link href={pageHref(page + 1)} className="px-3 py-1.5 rounded-lg text-sm text-stone hover:bg-black/4 transition-colors">بعدی</Link>
          )}
        </div>
      )}
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    FREE: "bg-black/6 text-stone",
    PLUS: "bg-ember/12 text-ember",
    PRO: "bg-gold/15 text-gold",
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full ${styles[plan] ?? "bg-black/6 text-stone"}`}>
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}
