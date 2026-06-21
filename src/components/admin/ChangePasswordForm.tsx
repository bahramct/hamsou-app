"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ChangePasswordForm — تغییر رمز ادمین (DECISION-038)
// سیاست: حداقل ۱۰ کاراکتر + حداقل ۳ از ۴ دسته (بزرگ/کوچک/رقم/نماد).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

function countClasses(pw: string): number {
  let n = 0;
  if (/[A-Z]/.test(pw)) n++;
  if (/[a-z]/.test(pw)) n++;
  if (/[0-9]/.test(pw)) n++;
  if (/[^A-Za-z0-9]/.test(pw)) n++;
  return n;
}

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const lenOk = next.length >= 10;
  const classesOk = countClasses(next) >= 3;
  const matchOk = next.length > 0 && next === confirm;
  // دکمه فقط وقتی رمزها match هستند و رمز فعلی وارد شده فعال می‌شود؛
  // اعتبارسنجی پیچیدگی در سرور انجام می‌شود و با toast خطا نشان داده می‌شود.
  const canSubmit = matchOk && current.length > 0 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!matchOk) { toast.error("رمز جدید و تکرار آن یکسان نیستند."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "خطایی رخ داد."); return; }
      toast.success("رمز با موفقیت تغییر کرد");
      setTimeout(() => { router.push("/admin"); router.refresh(); }, 600);
    } catch {
      toast.error("اتصال به سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="رمز فعلی" value={current} onChange={setCurrent} autoComplete="current-password" />
      <Field label="رمز جدید" value={next} onChange={setNext} autoComplete="new-password" />
      <Field label="تکرار رمز جدید" value={confirm} onChange={setConfirm} autoComplete="new-password" />

      {/* راهنمای پیچیدگی */}
      <div className="flex flex-col gap-1 text-[11px]">
        <Rule ok={lenOk}>حداقل ۱۰ کاراکتر</Rule>
        <Rule ok={classesOk}>حداقل ۳ از: حرف بزرگ، حرف کوچک، رقم، نماد</Rule>
        <Rule ok={matchOk}>تکرار رمز مطابقت دارد</Rule>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading && <Spinner />}
        ثبت رمز جدید
      </button>

      {!forced && (
        <button
          type="button"
          onClick={() => { router.push("/admin"); router.refresh(); }}
          className="text-xs text-stone hover:text-ink transition-colors"
        >
          انصراف
        </button>
      )}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-stone">{label}</label>
      <input
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir="ltr"
        className="w-full rounded-xl px-4 py-3 text-sm bg-white/60 border border-bone text-ink focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
      />
    </div>
  );
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className={`flex items-center gap-1.5 ${ok ? "text-sage-deep" : "text-fog"}`}>
      <span className="w-3 h-3 inline-flex items-center justify-center">{ok ? "✓" : "•"}</span>
      {children}
    </span>
  );
}
