"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AdminPersonalDiscount — صدور کد تخفیف اختصاصی برای کاربر از پنل ادمین (DECISION-109)
// دلیل اجباری است و عیناً در نوتیف کاربر نمایش داده می‌شود.
// POST /api/admin/users/[id]/discounts
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { onlyDigits, toEnDigits, toFaDigits } from "@/lib/utils/digits";

const CODE_RE = /^[A-Z0-9_-]{3,40}$/;

type Kind = "percent" | "fixed";

export function AdminPersonalDiscount({ userId }: { userId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [code, setCode] = useState("");
  const [kind, setKind] = useState<Kind>("percent");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [daysValid, setDaysValid] = useState("3");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const valueNum = parseInt(onlyDigits(toEnDigits(value)) || "0", 10);
  const maxUsesNum = parseInt(onlyDigits(toEnDigits(maxUses)) || "1", 10);
  const daysNum = parseInt(onlyDigits(toEnDigits(daysValid)) || "0", 10);

  async function submit() {
    if (saving) return;
    const upperCode = code.trim().toUpperCase();
    if (!CODE_RE.test(upperCode)) {
      toast.error("کد باید ۳ تا ۴۰ نویسه (حروف لاتین، عدد، - یا _) باشد.");
      return;
    }
    if (!valueNum || valueNum <= 0) {
      toast.error("مقدار تخفیف را وارد کن.");
      return;
    }
    if (kind === "percent" && (valueNum < 1 || valueNum > 100)) {
      toast.error("درصد تخفیف باید بین ۱ تا ۱۰۰ باشد.");
      return;
    }
    if (!maxUsesNum || maxUsesNum < 1) {
      toast.error("تعداد استفاده باید حداقل ۱ باشد.");
      return;
    }
    if (daysNum < 1) {
      toast.error("مدت اعتبار را وارد کن.");
      return;
    }
    if (!reason.trim()) {
      toast.error("دلیل صدور کد اجباری است.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: upperCode,
          kind,
          value: valueNum,
          maxUses: maxUsesNum,
          daysValid: daysNum,
          reason: reason.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "عملیات ناموفق بود.");
        return;
      }
      toast.success(`کد تخفیف ${data.code} صادر شد و نوتیف برای کاربر ارسال شد.`);
      setCode("");
      setValue("");
      setMaxUses("1");
      setDaysValid("3");
      setReason("");
      startTransition(() => router.refresh());
    } catch {
      toast.error("اتصال به سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-fog uppercase tracking-widest">کد تخفیف اختصاصی</p>

      {/* کد */}
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 40))}
        dir="ltr"
        placeholder="کد (مثل WELCOME20)"
        className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage transition-all tracking-widest"
      />

      {/* نوع تخفیف */}
      <div className="flex gap-2">
        {([
          { k: "percent", label: "درصدی (%)" },
          { k: "fixed", label: "مبلغ ثابت (تومان)" },
        ] as const).map((m) => (
          <button
            key={m.k}
            type="button"
            onClick={() => setKind(m.k)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-all ${
              kind === m.k
                ? "bg-sage/20 text-sage-deep font-medium border border-sage/30"
                : "bg-white/50 border border-bone text-fog hover:text-stone"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* مقدار */}
      <input
        value={value}
        onChange={(e) => setValue(toFaDigits(onlyDigits(toEnDigits(e.target.value))))}
        inputMode="numeric"
        dir="ltr"
        placeholder={kind === "percent" ? "درصد (مثل ۲۰)" : "مبلغ به تومان"}
        className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink text-center fa-num placeholder:text-fog focus:outline-none focus:border-sage transition-all"
      />

      {/* تعداد استفاده + مدت اعتبار */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 flex-1">
          <input
            value={maxUses}
            onChange={(e) => setMaxUses(toFaDigits(onlyDigits(toEnDigits(e.target.value))))}
            inputMode="numeric"
            dir="ltr"
            placeholder="۱"
            className="w-20 rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink text-center fa-num placeholder:text-fog focus:outline-none focus:border-sage transition-all"
          />
          <span className="text-xs text-stone">بار استفاده</span>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <input
            value={daysValid}
            onChange={(e) => setDaysValid(toFaDigits(onlyDigits(toEnDigits(e.target.value))))}
            inputMode="numeric"
            dir="ltr"
            placeholder="۳"
            className="w-20 rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink text-center fa-num placeholder:text-fog focus:outline-none focus:border-sage transition-all"
          />
          <span className="text-xs text-stone">روز اعتبار</span>
        </div>
      </div>

      {/* دلیل — نمایش عیناً در نوتیف کاربر */}
      <div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 300))}
          dir="rtl"
          rows={2}
          placeholder="دلیل صدور کد — عیناً در اعلان کاربر نمایش داده می‌شود (اجباری)"
          className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage transition-all resize-none"
        />
        <p className="text-[11px] text-fog mt-1 text-left" dir="ltr">
          {reason.length} / 300
        </p>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
      >
        {saving && <Spinner />}
        صدور کد تخفیف
      </button>
    </div>
  );
}
