// ─────────────────────────────────────────────────────────────────────────────
// /admin/audit — لاگ ممیزی (DECISION-043) — enforce: audit.read
//
// نمایش فقط-خواندنی از AdminAuditLog (جدول append-only؛ هیچ ویرایش/حذفی نیست).
// فیلتر: کنشگر، کنش (گروه‌بندی‌شده)، بازهٔ تاریخ، جستجوی شناسهٔ هدف. + صفحه‌بندی.
// متادیتای هر رویداد در یک <details> بومی (بدون JS کلاینت) باز می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { requirePermission } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import {
  describeAction,
  auditActionsByCategory,
  isAuditAction,
  type AuditTone,
} from "@/lib/admin/audit-actions";
import { JalaliDatePicker } from "@/components/ui/JalaliDatePicker";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

function toFa(n: number): string {
  return n.toLocaleString("fa-IR");
}

function faDateTime(d: Date): string {
  return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" });
}

// رنگ نشانِ هر تونِ کنش (هماهنگ با brand tokens)
const TONE_CLASS: Record<AuditTone, string> = {
  create: "bg-sage/15 text-sage-deep",
  update: "bg-mist/20 text-mist",
  security: "bg-gold/15 text-gold",
  danger: "bg-ember/12 text-ember",
  auth: "bg-black/6 text-stone",
};

// تبدیل رشتهٔ تاریخ ورودی (YYYY-MM-DD) به مرز بازه به وقت تهران (+03:30).
function parseTehranBoundary(value: string, edge: "start" | "end"): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = edge === "start" ? "00:00:00.000" : "23:59:59.999";
  const d = new Date(`${value}T${time}+03:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

interface SearchParams {
  actor?: string;
  action?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: string;
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission("audit.read");

  const sp = await searchParams;
  const actorFilter = (sp.actor ?? "").trim();
  const actionFilter = isAuditAction((sp.action ?? "").trim()) ? sp.action!.trim() : "";
  const q = (sp.q ?? "").trim();
  const fromStr = (sp.from ?? "").trim();
  const toStr = (sp.to ?? "").trim();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const fromDate = parseTehranBoundary(fromStr, "start");
  const toDate = parseTehranBoundary(toStr, "end");

  // لیست کنشگرها برای dropdown فیلتر (مجموعهٔ کوچک ادمین‌ها)
  const admins = await prisma.adminUser.findMany({
    select: { id: true, displayName: true, username: true },
    orderBy: { displayName: "asc" },
  });
  const actorValid = admins.some((a) => a.id === actorFilter);

  const createdAt =
    fromDate || toDate
      ? { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) }
      : undefined;

  const where = {
    ...(actorValid ? { actorId: actorFilter } : {}),
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(q ? { targetId: { contains: q } } : {}),
    ...(createdAt ? { createdAt } : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        actor: { select: { id: true, displayName: true, username: true, role: { select: { label: true } } } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilter = Boolean(actorValid || actionFilter || q || fromDate || toDate);
  const actionGroups = auditActionsByCategory();

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (actorValid) params.set("actor", actorFilter);
    if (actionFilter) params.set("action", actionFilter);
    if (q) params.set("q", q);
    if (fromStr) params.set("from", fromStr);
    if (toStr) params.set("to", toStr);
    params.set("page", String(p));
    return `/admin/audit?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-ink">لاگ ممیزی</h1>
        <p className="text-sm text-stone mt-1">
          ثبت تغییرناپذیر همهٔ اقدامات حساس ادمین — <span className="fa-num">{toFa(total)}</span> رویداد
          {hasFilter ? " (با فیلتر)" : ""}.
        </p>
      </header>

      <div className="rounded-xl bg-mist/15 border border-mist/30 px-4 py-3 text-[12px] leading-relaxed text-charcoal">
        این فهرست فقط-خواندنی است و append-only — هیچ رویدادی از پنل قابل ویرایش یا حذف نیست.
        هر سطر «چه کسی، چه کاری، روی چه هدفی، چه زمانی» را ثبت می‌کند؛ جزئیات فنی هر رویداد در «جزئیات» باز می‌شود.
      </div>

      {/* فیلترها */}
      <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 items-end">
        <Labeled label="کنشگر">
          <select name="actor" defaultValue={actorValid ? actorFilter : ""} className={ctrl}>
            <option value="">همه</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>{a.displayName}</option>
            ))}
          </select>
        </Labeled>

        <Labeled label="کنش">
          <select name="action" defaultValue={actionFilter} className={ctrl}>
            <option value="">همهٔ کنش‌ها</option>
            {actionGroups.map((g) => (
              <optgroup key={g.category} label={g.label}>
                {g.actions.map((a) => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Labeled>

        <Labeled label="از تاریخ">
          <JalaliDatePicker name="from" defaultValue={fromStr} placeholder="از تاریخ" />
        </Labeled>
        <Labeled label="تا تاریخ">
          <JalaliDatePicker name="to" defaultValue={toStr} placeholder="تا تاریخ" />
        </Labeled>

        <Labeled label="شناسهٔ هدف">
          <input name="q" defaultValue={q} dir="ltr" placeholder="جستجوی شناسه…" className={`${ctrl} num-latin`} />
        </Labeled>

        <div className="sm:col-span-2 lg:col-span-5 flex items-center gap-2">
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors">
            اعمال فیلتر
          </button>
          {hasFilter && (
            <Link href="/admin/audit" className="px-3 py-2.5 rounded-xl text-sm text-stone hover:text-ink hover:bg-black/4 transition-colors">
              پاک کردن
            </Link>
          )}
        </div>
      </form>

      {/* جدول */}
      {logs.length === 0 ? (
        <p className="text-sm text-fog italic py-12 text-center">رویدادی با این فیلتر یافت نشد.</p>
      ) : (
        <div className="rounded-2xl border border-black/8 bg-white/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/6 text-[11px] text-fog">
                <th className="text-right font-medium px-4 py-3">زمان</th>
                <th className="text-right font-medium px-4 py-3">کنشگر</th>
                <th className="text-right font-medium px-4 py-3">کنش</th>
                <th className="text-right font-medium px-4 py-3 hidden md:table-cell">هدف</th>
                <th className="text-right font-medium px-4 py-3 hidden lg:table-cell">جزئیات</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const def = describeAction(log.action);
                return (
                  <tr key={log.id} className="border-b border-black/4 last:border-0 align-top hover:bg-black/2 transition-colors">
                    <td className="px-4 py-3 text-fog text-xs whitespace-nowrap fa-num">{faDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="text-ink">{log.actor.displayName}</div>
                      <div className="text-[10px] text-fog num-latin" dir="ltr">@{log.actor.username}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full ${TONE_CLASS[def.tone]}`}>
                        {def.label}
                      </span>
                      <div className="text-[9px] text-fog/70 mt-1 num-latin" dir="ltr">{log.action}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <TargetCell targetType={log.targetType} targetId={log.targetId} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <MetaCell meta={log.meta} />
                    </td>
                  </tr>
                );
              })}
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

// هدف رویداد — کاربر به صفحهٔ جزئیاتش لینک می‌شود؛ بقیه به‌صورت متن فنی.
function TargetCell({ targetType, targetId }: { targetType: string | null; targetId: string | null }) {
  if (!targetType && !targetId) return <span className="text-fog/50">—</span>;
  const typeLabel: Record<string, string> = {
    user: "کاربر", admin: "ادمین", plan: "پلن", role: "نقش",
    discount: "کد تخفیف",
    "ai-service": "سرویس AI", "ai-binding": "اتصال AI", "ai-config": "پیکربندی AI", "ai-prompt": "پرامپت AI",
  };
  const label = targetType ? (typeLabel[targetType] ?? targetType) : "—";
  const idNode = targetId ? (
    <code className="text-[10px] text-stone num-latin" dir="ltr">{targetId}</code>
  ) : null;
  if (targetType === "user" && targetId) {
    return (
      <Link href={`/admin/users/${targetId}`} className="inline-flex flex-col gap-0.5 hover:underline">
        <span className="text-xs text-ember">{label}</span>
        {idNode}
      </Link>
    );
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-stone">{label}</span>
      {idNode}
    </div>
  );
}

// متادیتای JSON — در <details> بومی باز می‌شود (بدون JS کلاینت).
function MetaCell({ meta }: { meta: string | null }) {
  if (!meta) return <span className="text-fog/50">—</span>;
  let pretty = meta;
  try {
    pretty = JSON.stringify(JSON.parse(meta), null, 2);
  } catch {
    /* اگر JSON نبود، همان رشتهٔ خام نمایش داده می‌شود */
  }
  return (
    <details className="group">
      <summary className="cursor-pointer text-xs text-mist hover:text-ink select-none list-none">
        نمایش
      </summary>
      <pre dir="ltr" className="mt-2 max-w-xs overflow-auto rounded-lg bg-black/4 p-2 text-[10px] leading-relaxed text-charcoal num-latin whitespace-pre-wrap">
        {pretty}
      </pre>
    </details>
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
