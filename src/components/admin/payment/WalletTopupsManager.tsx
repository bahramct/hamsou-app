"use client";

// ─────────────────────────────────────────────────────────────────────────────
// WalletTopupsManager — بررسی و تأیید/ردِ درخواست‌های شارژ (DECISION-062)
// فیلتر وضعیت + pagination (25 ردیف) + نمایش هر ۲ کارت کاربر برای تطبیق.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { onlyDigits } from "@/lib/utils/digits";

export interface TopupView {
  id: string;
  refCode: string;
  amount: number;
  status: string;
  gateway: string | null; // "zarinpal" | null (کارت‌به‌کارتِ دستی) — DECISION-071
  gatewayRefId: string | null; // شمارهٔ پیگیریِ بانکی
  payerCardSnapshot: string | null; // کارتی که کاربر هنگام درخواست انتخاب کرد
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    registeredCard: string | null;   // کارت اول
    registeredCard2: string | null;  // کارت دوم
  } | null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "در انتظار", cls: "bg-amber-400/15 text-amber-700" },
  approved: { label: "تأیید شد", cls: "bg-sage/15 text-sage-deep" },
  rejected: { label: "رد شد", cls: "bg-ember/10 text-ember" },
};

type FilterStatus = "all" | "pending" | "approved" | "rejected";

const PAGE_SIZE = 25;

function groupCard(num: string | null): string {
  if (!num) return "—";
  return (num.match(/.{1,4}/g) ?? [num]).join(" - ");
}

function faDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fa-IR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export function WalletTopupsManager({ topups, canManage }: { topups: TopupView[]; canManage: boolean }) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);

  const filtered = filter === "all" ? topups : topups.filter((t) => t.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pendingCount = topups.filter((t) => t.status === "pending").length;

  function changeFilter(f: FilterStatus) {
    setFilter(f);
    setPage(1);
  }

  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            درخواست‌های شارژ
            {pendingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-700 fa-num">
                {pendingCount.toLocaleString("fa-IR")} در انتظار
              </span>
            )}
          </h2>
          <p className="text-xs text-fog mt-0.5">
            مبدأِ واریز باید همان «کارتِ انتخابی کاربر» باشد. شناسهٔ یکتا را برای پیگیری نگه‌دار.
          </p>
        </div>
        {/* فیلتر وضعیت */}
        <div className="flex items-center gap-1 bg-black/4 rounded-xl p-0.5">
          {(["all", "pending", "approved", "rejected"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => changeFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                filter === f
                  ? "bg-white shadow-sm text-ink"
                  : "text-stone hover:text-ink"
              }`}
            >
              {f === "all" ? "همه" : STATUS[f]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      {paginated.length === 0 ? (
        <p className="text-[11px] text-fog bg-black/3 rounded-lg px-3 py-2">
          {filter === "pending" ? "هیچ درخواست در انتظاری نیست." : "درخواستی ثبت نشده است."}
        </p>
      ) : (
        <>
          <div className="space-y-2.5">
            {paginated.map((t) => <TopupRow key={t.id} topup={t} canManage={canManage} />)}
          </div>

          {/* pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/6">
              <span className="text-[11px] text-fog fa-num">
                {filtered.length.toLocaleString("fa-IR")} درخواست · صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-stone hover:bg-black/5 disabled:opacity-30"
                >
                  قبلی
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pg = i + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                        page === pg ? "bg-ink text-paper" : "text-stone hover:bg-black/5"
                      }`}
                    >
                      {pg.toLocaleString("fa-IR")}
                    </button>
                  );
                })}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-stone hover:bg-black/5 disabled:opacity-30"
                >
                  بعدی
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function TopupRow({ topup, canManage }: { topup: TopupView; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<null | "approve" | "reject">(null);
  const [amount, setAmount] = useState(String(topup.amount));
  const [reason, setReason] = useState("");

  const st = STATUS[topup.status] ?? { label: topup.status, cls: "bg-black/5 text-stone" };
  const isPending = topup.status === "pending";
  const u = topup.user;

  // کارت‌های ثبت‌شدهٔ کاربر
  const cards = [u?.registeredCard, u?.registeredCard2].filter(Boolean) as string[];
  // کارتی که در این درخواست انتخاب شد
  const usedCard = topup.payerCardSnapshot;
  // آیا کارت درخواست با یکی از کارت‌های ثبت‌شده مطابقت دارد؟
  const cardMatch = usedCard ? cards.includes(usedCard) : false;

  async function approve() {
    const amt = parseInt(onlyDigits(amount), 10);
    if (!amt || amt <= 0) { toast.error("مبلغ نامعتبر است."); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/payment/topups/${topup.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "تأیید ناموفق بود."); return; }
      toast.success("شارژ تأیید و کیف‌پول شارژ شد");
      router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); setMode(null); }
  }

  async function reject() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/payment/topups/${topup.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "رد ناموفق بود."); return; }
      toast.success("درخواست رد شد");
      router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); setMode(null); }
  }

  return (
    <div className="rounded-xl border border-black/8 bg-white/50 px-4 py-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 space-y-1.5">
          {/* مبلغ + وضعیت */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink fa-num">{topup.amount.toLocaleString("fa-IR")} تومان</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
            {topup.gateway && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-mist/20 text-charcoal">
                {topup.gateway === "zarinpal" ? "زرین‌پال" : "درگاه آنلاین"}
              </span>
            )}
          </div>
          {/* شناسه + تاریخ */}
          <div className="text-[11px] text-fog flex items-center gap-2 flex-wrap">
            <span className="num-latin text-stone font-medium" dir="ltr">{topup.refCode}</span>
            {topup.gatewayRefId && (
              <>
                <span>·</span>
                <span className="num-latin" dir="ltr">پیگیری: {topup.gatewayRefId}</span>
              </>
            )}
            <span>·</span>
            <span>{faDateTime(topup.createdAt)}</span>
            {topup.reviewedAt && (
              <>
                <span>·</span>
                <span>بررسی: {faDateTime(topup.reviewedAt)}</span>
              </>
            )}
          </div>
          {/* اطلاعات کاربر */}
          <div className="text-[12px] text-charcoal">
            {u?.name ?? "—"}
            {u?.phone && <span className="num-latin text-fog mr-2" dir="ltr"> · {u.phone}</span>}
          </div>
          {/* کارت‌های کاربر — فقط برای شارژِ کارت‌به‌کارتِ دستی */}
          {!topup.gateway && (
          <div className="space-y-1">
            {cards.length === 0 ? (
              <div className="text-[11px] text-fog">کارتی ثبت نشده</div>
            ) : (
              cards.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className="text-fog">کارت {i === 0 ? "اول" : "دوم"}:</span>
                  <span className="num-latin text-ink" dir="ltr">{groupCard(c)}</span>
                  {c === usedCard && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sage/15 text-sage-deep">استفاده شد</span>
                  )}
                </div>
              ))
            )}
          </div>
          )}
          {/* پرداختِ درگاهی — پیامِ راهنما به‌جای اکشن دستی */}
          {topup.gateway && topup.status === "pending" && (
            <div className="text-[11px] text-fog">در انتظارِ تکمیلِ پرداخت توسط کاربر در درگاه.</div>
          )}
          {/* کارت واریزشده (snapshot) */}
          {usedCard && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-fog">واریز از:</span>
              <span className={`num-latin font-medium ${cardMatch ? "text-ink" : "text-ember"}`} dir="ltr">
                {groupCard(usedCard)}
              </span>
              {!cardMatch && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-ember/10 text-ember">عدم تطابق!</span>
              )}
            </div>
          )}
          {/* دلیل رد */}
          {topup.status === "rejected" && topup.adminNote && (
            <div className="text-[11px] text-ember">دلیل رد: {topup.adminNote}</div>
          )}
        </div>

        {canManage && isPending && mode === null && !topup.gateway && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setMode("approve")} className="text-xs px-3 py-1.5 rounded-lg bg-ink text-paper hover:bg-charcoal transition-colors">تأیید</button>
            <button onClick={() => setMode("reject")} className="text-xs px-3 py-1.5 rounded-lg text-ember hover:bg-ember/8 transition-colors">رد</button>
          </div>
        )}
      </div>

      {/* فرم تأیید */}
      {mode === "approve" && (
        <div className="mt-3 pt-3 border-t border-black/6 flex items-end gap-2 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-stone">مبلغ نهایی (تومان)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              dir="ltr"
              autoComplete="off"
              className="w-40 rounded-lg px-3 py-2 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage num-latin text-center"
            />
          </div>
          <button onClick={approve} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink text-paper text-sm hover:bg-charcoal transition-colors disabled:opacity-40">
            {busy && <Spinner size={13} />} تأیید و شارژ
          </button>
          <button onClick={() => setMode(null)} disabled={busy} className="px-3 py-2 rounded-lg text-sm text-stone hover:bg-black/4">انصراف</button>
        </div>
      )}

      {/* فرم رد */}
      {mode === "reject" && (
        <div className="mt-3 pt-3 border-t border-black/6 flex items-end gap-2 flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-48">
            <label className="text-[11px] text-stone">دلیل رد (اختیاری)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage"
              placeholder="مثلاً واریزی یافت نشد"
            />
          </div>
          <button onClick={reject} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ember text-paper text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
            {busy && <Spinner size={13} />} رد درخواست
          </button>
          <button onClick={() => setMode(null)} disabled={busy} className="px-3 py-2 rounded-lg text-sm text-stone hover:bg-black/4">انصراف</button>
        </div>
      )}
    </div>
  );
}
