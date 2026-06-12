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
  isBanned: boolean;
  canPlan: boolean;
  canBan: boolean;
}

export function UserActions({ userId, currentPlan, currentCycle, isBanned, canPlan, canBan }: Props) {
  const router = useRouter();
  const [plan, setPlan] = useState(currentPlan);
  const [cycle, setCycle] = useState<"monthly" | "annual">(
    currentCycle === "annual" ? "annual" : "monthly"
  );
  const [banned, setBanned] = useState(isBanned);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
        <div className="space-y-3">
          <p className="text-[11px] text-fog uppercase tracking-widest">تغییر پلن</p>

          {/* چرخهٔ صورتحساب — فقط برای پلن‌های پولی */}
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
