// ─────────────────────────────────────────────────────────────────────────────
// /admin/users — لیست کاربران + جستجوی زنده + فیلتر پلن (enforce: users.read)
// طراحی کارت‌محور با آواتار، آمار و badge پلن — جایگزین جدول ساده
// حریم خصوصی (DECISION-026 §۷): محتوای تعهد نمایش داده نمی‌شود؛ فقط متادیتا.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { USER_PLANS, type UserPlan } from "@/constants/plans";
import { toFaDigits } from "@/lib/utils/digits";
import { AVATAR_COLOR } from "@/lib/profile/avatarPresets";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { countCommitmentsBulk } from "@/lib/stats/commitments";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = { FREE: "رایگان", PLUS: "پلاس", PRO: "پرو" };
const PAGE_SIZE = 12; // ۳ ستون × ۴ ردیف

const PLAN_STYLE: Record<string, { pill: string; ring: string; dot: string }> = {
  FREE: {
    pill: "bg-black/6 text-stone",
    ring: "ring-black/10",
    dot: "bg-stone/40",
  },
  PLUS: {
    pill: "bg-sage/18 text-sage-deep",
    ring: "ring-sage/25",
    dot: "bg-sage",
  },
  PRO: {
    pill: "bg-amber-100 text-amber-700",
    ring: "ring-amber-300/40",
    dot: "bg-amber-400",
  },
};

function toFa(n: number) { return n.toLocaleString("fa-IR"); }
function faDate(d: Date) {
  return d.toLocaleDateString("fa-IR", { year: "numeric", month: "short", timeZone: "Asia/Tehran" });
}

// href فیلتر پلن — searchQuery را حفظ می‌کند
function planHref(plan: string, q: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (plan) params.set("plan", plan);
  return `/admin/users?${params.toString()}`;
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
    ...(q ? {
      OR: [
        { phone: { contains: q } },
        { email: { contains: q } },
        { displayName: { contains: q } },
        { username: { contains: q } },
      ],
    } : {}),
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
        username: true,
        plan: true,
        isBanned: true,
        createdAt: true,
        avatarImage: true,
        _count: {
          select: {
            supportTickets: true,
          },
        },
      },
    }),
  ]);

  // «تعهد» = روزهای دارای تعهد، بدون روزهای داخل بازه‌های فاصله (DECISION-074)
  const commitmentByUser = await countCommitmentsBulk(users.map((u) => u.id));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const ac = AVATAR_COLOR;

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (planFilter) params.set("plan", planFilter);
    params.set("page", String(p));
    return `/admin/users?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* ─── هدر ─── */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">کاربران</h1>
          <p className="text-sm text-stone mt-0.5 fa-num">{toFa(total)} کاربر</p>
        </div>
      </header>

      {/* ─── جستجو + فیلتر ─── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* جستجوی زنده — client component */}
        <AdminSearchInput
          defaultValue={q}
          currentPlan={planFilter ?? ""}
          basePath="/admin/users"
          placeholder="جستجو با نام، موبایل، ایمیل یا نام‌کاربری…"
        />

        {/* فیلتر پلن — Link (بدون form) */}
        <div className="flex items-center gap-1.5 bg-white/50 border border-bone rounded-xl px-2 py-1.5">
          {["", ...USER_PLANS].map((p) => (
            <Link
              key={p}
              href={planHref(p, q)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                (planFilter ?? "") === p
                  ? "bg-ink text-paper shadow-sm"
                  : "text-stone hover:text-ink hover:bg-black/5"
              }`}
            >
              {p === "" ? "همه" : PLAN_LABELS[p]}
            </Link>
          ))}
        </div>

        {(q || planFilter) && (
          <Link
            href="/admin/users"
            className="px-3 py-2.5 rounded-xl text-sm text-stone hover:text-ink hover:bg-black/4 transition-colors"
          >
            پاک
          </Link>
        )}
      </div>

      {/* ─── کارت‌ها ─── */}
      {users.length === 0 ? (
        <div className="text-center py-16 text-sm text-fog italic">کاربری یافت نشد.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map((u) => {
            const planStyle = PLAN_STYLE[u.plan] ?? PLAN_STYLE.FREE;
            const initLetter = u.displayName?.trim()[0] ?? u.phone?.[0] ?? u.email?.[0] ?? "؟";
            // شماره تلفن و ایمیل هر دو LTR هستند — علامت + باید سمت چپ باشد
            const identity = u.phone ? toFaDigits(u.phone) : (u.email ?? "—");

            return (
              <div
                key={u.id}
                className="group relative rounded-2xl border border-black/8 bg-white/55 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.09)] hover:border-black/14 transition-all duration-250 overflow-hidden"
              >
                {/* خط باریک ساده بالای کارت */}
                <div className="absolute top-0 inset-x-0 h-px bg-black/8 rounded-t-2xl" />

                <div className="px-4 pt-4 pb-3.5 space-y-3">
                  {/* ردیف اول: آواتار + نام/شناسه + پلن/یوزرنیم */}
                  <div className="flex items-start gap-3">
                    {/* آواتار */}
                    <div
                      className={`shrink-0 w-10 h-10 rounded-xl ring-2 ${planStyle.ring} flex items-center justify-center text-sm font-semibold select-none overflow-hidden`}
                      style={u.avatarImage ? undefined : { backgroundColor: ac.bg, color: ac.fg }}
                    >
                      {u.avatarImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatarImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initLetter
                      )}
                    </div>

                    {/* نام + شناسه */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-ink leading-tight truncate">
                          {u.displayName || <span className="text-fog font-normal">بدون نام</span>}
                        </span>
                        {u.isBanned && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-ember/10 text-ember border border-ember/20">
                            مسدود
                          </span>
                        )}
                      </div>
                      {/* شماره تلفن/ایمیل: dir="ltr" تا علامت + سمت چپ، text-right تا زیر نام قرار گیرد */}
                      <p className="text-[11px] text-fog mt-0.5 truncate fa-num text-right" dir="ltr">
                        {identity}
                      </p>
                    </div>

                    {/* پلن + نام‌کاربری (زیر هم، سمت راست) */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${planStyle.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${planStyle.dot}`} />
                        {PLAN_LABELS[u.plan] ?? u.plan}
                      </span>
                      {u.username && (
                        <p className="text-[10px] text-stone/60 num-latin leading-none" dir="ltr">
                          @{u.username}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ردیف دوم: آمار + دکمه */}
                  <div className="flex items-center border-t border-black/5 pt-2.5">
                    <div className="flex-1 flex items-center gap-3">
                      <Stat value={commitmentByUser.get(u.id) ?? 0} label="تعهد" />
                      <Stat value={u._count.supportTickets} label="تیکت" />
                      <span className="text-[10px] text-fog/70 fa-num">{faDate(u.createdAt)}</span>
                    </div>
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="shrink-0 inline-flex items-center gap-0.5 text-[11px] text-stone hover:text-ember transition-colors"
                    >
                      جزئیات
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M9 18l-6-6 6-6"/></svg>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="px-4 py-2 rounded-xl text-sm text-stone hover:bg-black/5 hover:text-ink transition-colors border border-bone">
              → قبلی
            </Link>
          ) : (
            <span className="px-4 py-2 rounded-xl text-sm text-fog/40 border border-bone/50 cursor-default">→ قبلی</span>
          )}
          <span className="text-xs text-fog fa-num px-2">
            {toFa(page)} از {toFa(totalPages)}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="px-4 py-2 rounded-xl text-sm text-stone hover:bg-black/5 hover:text-ink transition-colors border border-bone">
              بعدی ←
            </Link>
          ) : (
            <span className="px-4 py-2 rounded-xl text-sm text-fog/40 border border-bone/50 cursor-default">بعدی ←</span>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-sm font-semibold text-ink fa-num">{toFa(value)}</span>
      <span className="text-[10px] text-fog">{label}</span>
    </div>
  );
}
