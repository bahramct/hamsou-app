"use client";

// ─────────────────────────────────────────────────────────────────────────────
// UserActions — تغییر پلن و مسدودسازی کاربر در صفحه جزئیات
// دکمه‌ها فقط وقتی permission مربوطه وجود دارد نمایش داده می‌شوند (canPlan/canBan).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const PLANS = [
  { code: "FREE", label: "رایگان" },
  { code: "PLUS", label: "پلاس" },
  { code: "PRO", label: "پرو" },
] as const;

interface Props {
  userId: string;
  currentPlan: string;
  currentCycle?: string | null;
  /** ISO رشتهٔ تاریخِ انقضای پلن — null = دائمی */
  planExpiresAt?: string | null;
  isBanned: boolean;
  canPlan: boolean;
  canBan: boolean;
}

export function UserActions({ userId, currentPlan, currentCycle, planExpiresAt, isBanned, canPlan, canBan }: Props) {
  const router = useRouter();
  const [plan, setPlan] = useState(currentPlan);
  const [cycle, setCycle] = useState<"monthly" | "annual">(
    currentCycle === "annual" ? "annual" : "monthly"
  );
  const [banned, setBanned] = useState(isBanned);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [adjustVal, setAdjustVal] = useState("30");
  const [adjustError, setAdjustError] = useState("");

  async function changePlan(next: string) {
    if (next === plan || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: next, cycle: next !== "FREE" ? cycle : null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطا در تغییر پلن."); return; }
      setPlan(next);
      startTransition(() => router.refresh());
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleBan() {
    if (busy) return;
    const next = !banned;
    if (next && !confirm("این کاربر مسدود شود؟ دیگر نمی‌تواند وارد شود.")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: next }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "خطا در عملیات."); return; }
      setBanned(next);
      startTransition(() => router.refresh());
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function doAdjustDays(sign: 1 | -1) {
    const n = parseInt(adjustVal, 10);
    if (!n || n <= 0 || busy) return;
    const days = sign * n;
    setBusy(true);
    setAdjustError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan-adjust-days`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (!res.ok) { setAdjustError(data.error ?? "خطا در تنظیمِ روز."); return; }
      startTransition(() => router.refresh());
    } catch {
      setAdjustError("اتصال به سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  if (!canPlan && !canBan) {
    return (
      <p className="text-xs text-fog italic">
        نقش تو اجازه تغییر این کاربر را ندارد (فقط مشاهده).
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {canPlan && (
        <div className="space-y-4">
          <p className="text-[11px] text-fog uppercase tracking-widest">تغییر پلن</p>

          {/* چرخهٔ صورتحساب */}
          <div className="flex gap-2">
            {(["monthly", "annual"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  cycle === c
                    ? "bg-sage/20 text-sage-deep font-medium border border-sage/30"
                    : "bg-white/50 border border-bone text-fog hover:text-stone"
                }`}
              >
                {c === "monthly" ? "ماهانه" : "سالانه"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {PLANS.map((p) => (
              <button
                key={p.code}
                onClick={() => changePlan(p.code)}
                disabled={busy || pending}
                className={`px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50 ${
                  plan === p.code
                    ? "bg-ink text-paper font-medium"
                    : "bg-white/60 border border-bone text-stone hover:text-ink hover:border-black/15"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* تنظیمِ روزهای انقضا */}
          <div className="space-y-2 rounded-xl border border-bone bg-white/40 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-fog uppercase tracking-widest">تنظیمِ روز</p>
              {planExpiresAt ? (
                <span className="text-[11px] text-stone">
                  انقضا: {new Date(planExpiresAt).toLocaleDateString("fa-IR")}
                </span>
              ) : plan !== "FREE" ? (
                <span className="text-[11px] text-fog">دائمی</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => doAdjustDays(-1)}
                disabled={busy || pending}
                title="کم کردن از انقضا"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-bone bg-white/60 text-stone transition-all hover:border-ember/40 hover:text-ember disabled:opacity-40"
              >
                −
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={adjustVal}
                  onChange={(e) => setAdjustVal(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-lg border border-bone bg-white/60 px-3 py-2 text-center text-sm text-ink outline-none focus:border-black/20"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-fog">روز</span>
              </div>
              <button
                type="button"
                onClick={() => doAdjustDays(1)}
                disabled={busy || pending}
                title="افزودن به انقضا"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-bone bg-white/60 text-stone transition-all hover:border-sage/50 hover:text-sage-deep disabled:opacity-40"
              >
                +
              </button>
            </div>
            {adjustError && <p className="text-[11px] text-ember">{adjustError}</p>}
          </div>
        </div>
      )}

      {canBan && (
        <div>
          <p className="text-[11px] text-fog uppercase tracking-widest mb-2">وضعیت دسترسی</p>
          <button
            onClick={toggleBan}
            disabled={busy || pending}
            className={`px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50 ${
              banned
                ? "bg-sage/15 text-sage-deep hover:bg-sage/25"
                : "bg-ember/10 text-ember hover:bg-ember/20"
            }`}
          >
            {banned ? "رفع مسدودی" : "مسدودسازی کاربر"}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-ember">{error}</p>}
    </div>
  );
}
