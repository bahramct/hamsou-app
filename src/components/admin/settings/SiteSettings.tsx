"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SiteSettings — فرمِ تنظیماتِ عمومیِ سایت در پنل (DECISION-088)
// فعلاً: روشن/خاموشِ سفرِ onboarding. ذخیره → POST /api/admin/settings.
// قانونِ متنِ دکمه (DECISION-053): متنِ دکمه ثابت؛ حین کار فقط Spinner؛ نتیجه با toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

interface Initial {
  onboardingEnabled: boolean;
}

export function SiteSettings({
  initial,
  canManage,
}: {
  initial: Initial;
  canManage: boolean;
}) {
  const [onboardingEnabled, setOnboardingEnabled] = useState(initial.onboardingEnabled);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving || !canManage) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingEnabled }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "ذخیره ناموفق بود.");
        return;
      }
      toast.success("تنظیمات سایت ذخیره شد.");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-xl font-semibold text-ink">تنظیمات سایت</h1>
        <p className="text-sm text-stone mt-1">
          تنظیماتِ عمومیِ تجربهٔ کاربران در سمتِ سایت.
        </p>
      </header>

      {/* سفرِ onboarding — روشن/خاموش */}
      <section className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">سفرِ خوش‌آمدگویی (Onboarding)</h2>
          <p className="text-xs text-fog mt-0.5 leading-relaxed max-w-md">
            با ورودِ کاربرِ تازه‌وارد، یک سفرِ کوتاهِ آشنایی (روایت + نام + همدم) نمایش داده می‌شود.
            خاموش‌کردن، کاربرانِ جدید را مستقیم به داشبورد می‌برد.
          </p>
        </div>
        <button
          type="button"
          onClick={() => canManage && setOnboardingEnabled((v) => !v)}
          role="switch"
          aria-checked={onboardingEnabled}
          disabled={!canManage}
          className={`relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
            onboardingEnabled ? "bg-sage" : "bg-black/15"
          }`}
        >
          <span
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-paper-sm transition-all"
            style={{ right: onboardingEnabled ? "0.25rem" : "1.75rem" }}
          />
        </button>
      </section>

      {canManage && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
          >
            {saving && <Spinner />}
            ذخیرهٔ تنظیمات
          </button>
        </div>
      )}
    </div>
  );
}
