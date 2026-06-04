"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LiveChatSettings — فرم تنظیمات چت آنلاین در پنل (DECISION-049)
// روشن/خاموش کلی + متن خوش‌آمد ({{NAME}}) + ساعات کاری (روزها + بازهٔ ساعت).
// ذخیره → POST /api/admin/livechat/settings (enforce: support.respond).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import { WEEK_DAYS, renderSupportWelcome, type WorkingHours } from "@/lib/support/chat";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

interface Initial {
  enabled: boolean;
  welcome: string;
  hours: WorkingHours;
}

export function LiveChatSettings({ initial }: { initial: Initial }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [welcome, setWelcome] = useState(initial.welcome);
  const [days, setDays] = useState<number[]>(initial.hours.days);
  const [from, setFrom] = useState(initial.hours.from);
  const [to, setTo] = useState(initial.hours.to);
  const [saving, setSaving] = useState(false);

  const toggleDay = (dow: number) => {
    setDays((prev) => (prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]));
  };

  const save = async () => {
    if (saving) return;
    if (!welcome.trim()) {
      toast.error("متن خوش‌آمد خالی است.");
      return;
    }
    if (days.length === 0) {
      toast.error("حداقل یک روز کاری انتخاب کن.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/livechat/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, welcome: welcome.trim(), hours: { days, from, to } }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "ذخیره ناموفق بود.");
        return;
      }
      toast.success("تنظیمات چت آنلاین ذخیره شد.");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  };

  const previewWelcome = renderSupportWelcome(welcome, "نام کاربر");

  return (
    <div className="space-y-6 max-w-2xl">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">تنظیمات چت آنلاین</h1>
          <p className="text-sm text-stone mt-1">ساعات کاری، متن خوش‌آمد و روشن/خاموش کلی.</p>
        </div>
        <Link href="/admin/livechat" className="text-xs text-stone hover:text-ink hover:bg-black/4 px-3 py-2 rounded-lg transition-colors">
          ← بازگشت به کنسول
        </Link>
      </header>

      {/* روشن/خاموش */}
      <section className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">چت آنلاین فعال باشد</h2>
          <p className="text-xs text-fog mt-0.5">خاموش‌کردن، ورودی چت را برای همهٔ کاربران پرو غیرفعال می‌کند.</p>
        </div>
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          role="switch"
          aria-checked={enabled}
          className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${enabled ? "bg-sage" : "bg-black/15"}`}
        >
          <span
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-paper-sm transition-all"
            style={{ right: enabled ? "0.25rem" : "1.75rem" }}
          />
        </button>
      </section>

      {/* متن خوش‌آمد */}
      <section className="glass rounded-2xl p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">متن خوش‌آمد</h2>
          <p className="text-xs text-fog mt-0.5">
            با باز شدن چت نمایش داده می‌شود. <code className="text-ember">{"{{NAME}}"}</code> با نام کاربر جایگزین می‌شود.
          </p>
        </div>
        <textarea
          value={welcome}
          onChange={(e) => setWelcome(e.target.value)}
          rows={3}
          maxLength={600}
          className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink focus:outline-none focus:border-sage leading-relaxed resize-none"
        />
        <div className="rounded-xl bg-white/60 border border-black/6 px-3 py-2.5">
          <p className="text-[10px] text-fog mb-1">پیش‌نمایش:</p>
          <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{previewWelcome}</p>
        </div>
      </section>

      {/* ساعات کاری */}
      <section className="glass rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">ساعات پاسخگویی</h2>
          <p className="text-xs text-fog mt-0.5">خارج از این روزها/ساعت‌ها، کاربر «خارج از ساعت کاری» می‌بیند و نمی‌تواند پیام بفرستد.</p>
        </div>

        {/* روزها */}
        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map((d) => {
            const on = days.includes(d.dow);
            return (
              <button
                key={d.dow}
                type="button"
                onClick={() => toggleDay(d.dow)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                  on
                    ? "bg-ink text-paper border-ink"
                    : "bg-white/60 text-stone border-bone hover:border-sage"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* بازهٔ ساعت */}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs text-stone">
            از ساعت
            <input
              type="time"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg px-2 py-1.5 text-sm bg-white/60 border border-bone text-ink focus:outline-none focus:border-sage"
              dir="ltr"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-stone">
            تا ساعت
            <input
              type="time"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg px-2 py-1.5 text-sm bg-white/60 border border-bone text-ink focus:outline-none focus:border-sage"
              dir="ltr"
            />
          </label>
        </div>
      </section>

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
    </div>
  );
}
