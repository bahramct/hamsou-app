"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ReminderSettingsModal — تنظیمِ یادآوریِ هدف (DECISION-082؛ opt-in طبق DECISION-023)
// فعال/غیرفعال، ساعت‌ها (حداکثر ۳ — select ساعت/دقیقه با ارقام فارسی)، کانال، متنِ سفارشی.
// لحنِ آرام و ضدفشار. متنِ دکمه ثابت + Spinner + toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";
import { toFaDigits } from "@/lib/utils/digits";
import type { GoalReminderConfig, ReminderChannel } from "@/types/goal";

const MAX_TIMES = 3;
const MAX_MSG = 200;
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

const CHANNELS: { key: ReminderChannel; label: string }[] = [
  { key: "inapp", label: "درون‌برنامه" },
  { key: "email", label: "ایمیل" },
  { key: "both", label: "هر دو" },
];

export function ReminderSettingsModal({
  goalId,
  config,
  onClose,
}: {
  goalId: string;
  config: GoalReminderConfig;
  onClose: () => void;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(config.enabled);
  const [times, setTimes] = useState<string[]>(config.times.length ? config.times : []);
  const [channel, setChannel] = useState<ReminderChannel>(config.channel);
  const [message, setMessage] = useState(config.customMessage ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  function setTimePart(idx: number, part: "h" | "m", val: string) {
    setTimes((cur) => {
      const next = [...cur];
      const [h, m] = (next[idx] ?? "09:00").split(":");
      next[idx] = part === "h" ? `${val}:${m}` : `${h}:${val}`;
      return next;
    });
  }
  function addTime() {
    setTimes((cur) => (cur.length >= MAX_TIMES ? cur : [...cur, "09:00"]));
  }
  function removeTime(idx: number) {
    setTimes((cur) => cur.filter((_, i) => i !== idx));
  }

  function save() {
    if (isPending) return;
    if (enabled && times.length === 0) {
      toast.error("برای فعال‌کردن، حداقل یک ساعت اضافه کن.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/goal/${goalId}/reminder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled,
            times,
            channel,
            customMessage: message.trim() || null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success("یادآوری ذخیره شد");
          router.refresh();
          close();
        } else {
          toast.error(data.message ?? "مشکلی پیش آمد");
        }
      } catch {
        toast.error("اتصال برقرار نشد");
      }
    });
  }

  return (
    <>
      <div
        aria-hidden
        onClick={close}
        className="fixed inset-0 z-50"
        style={{
          background: "rgba(26,26,31,0.22)",
          backdropFilter: visible ? "blur(6px)" : "none",
          opacity: visible ? 1 : 0,
          transition: "opacity 220ms ease, backdrop-filter 220ms ease",
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-5" role="dialog" aria-modal="true" aria-label="یادآوری">
        <div
          className="pointer-events-auto w-full max-w-md overflow-hidden rounded-3xl border border-black/8 shadow-[0_20px_60px_rgba(26,26,31,0.18),0_0_0_1px_rgba(255,255,255,0.5)_inset]"
          style={{
            background: "rgba(var(--rgb-paper),0.94)",
            backdropFilter: "blur(24px) saturate(140%)",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.94)",
            transition: "opacity 220ms ease, transform 280ms cubic-bezier(0.19,1,0.22,1)",
          }}
        >
          <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">یادآوریِ مسیر</h2>
            <button type="button" onClick={close} aria-label="بستن" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/6 hover:bg-black/10">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="max-h-[64vh] space-y-5 overflow-y-auto px-5 py-5 [&::-webkit-scrollbar]:hidden">
            {/* فعال/غیرفعال */}
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-sm text-ink">یادآوری فعال باشد</span>
              <button
                type="button"
                onClick={() => setEnabled((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-sage" : "bg-black/15"}`}
                aria-pressed={enabled}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${enabled ? "left-0.5" : "left-[1.375rem]"}`} />
              </button>
            </label>

            <p className="text-[12px] leading-relaxed text-fog">
              یادآوری‌ها آرام‌اند و هر زمان خواستی می‌توانی خاموش‌شان کنی.
            </p>

            {enabled && (
              <>
                {/* ساعت‌ها */}
                <div>
                  <p className="mb-2 text-xs font-medium text-stone">در چه ساعت‌هایی؟</p>
                  <div className="space-y-2">
                    {times.map((t, idx) => {
                      const [h, m] = t.split(":");
                      return (
                        <div key={idx} className="flex items-center gap-2" dir="ltr">
                          <select
                            value={h}
                            onChange={(e) => setTimePart(idx, "h", e.target.value)}
                            className="rounded-lg border border-bone bg-white/60 px-2 py-1.5 text-sm text-ink focus:outline-none"
                          >
                            {HOURS.map((hh) => (
                              <option key={hh} value={hh}>{toFaDigits(hh)}</option>
                            ))}
                          </select>
                          <span className="text-stone">:</span>
                          <select
                            value={m}
                            onChange={(e) => setTimePart(idx, "m", e.target.value)}
                            className="rounded-lg border border-bone bg-white/60 px-2 py-1.5 text-sm text-ink focus:outline-none"
                          >
                            {MINUTES.map((mm) => (
                              <option key={mm} value={mm}>{toFaDigits(mm)}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeTime(idx)}
                            className="mr-1 rounded-full px-2 py-1 text-[11px] text-fog hover:text-ember"
                          >
                            حذف
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {times.length < MAX_TIMES && (
                    <button
                      type="button"
                      onClick={addTime}
                      className="mt-2 rounded-full border border-dashed border-stone/30 px-3 py-1.5 text-[12px] text-stone hover:border-sage/50 hover:text-sage-deep"
                    >
                      + افزودن ساعت
                    </button>
                  )}
                </div>

                {/* کانال */}
                <div>
                  <p className="mb-2 text-xs font-medium text-stone">از چه راهی؟</p>
                  <div className="flex gap-1.5">
                    {CHANNELS.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setChannel(c.key)}
                        className={`flex-1 rounded-xl px-3 py-2 text-[12px] transition-colors ${
                          channel === c.key
                            ? "bg-sage/15 text-sage-deep ring-1 ring-sage/30"
                            : "bg-black/4 text-stone hover:bg-black/6"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* متن سفارشی */}
                <div>
                  <p className="mb-2 text-xs font-medium text-stone">متنِ یادآوری (اختیاری)</p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
                    rows={2}
                    dir="rtl"
                    placeholder="مثلاً: یک لحظه به مسیرت سر بزن."
                    className="w-full resize-none rounded-xl border border-bone bg-white/50 p-3 text-[13px] leading-relaxed text-ink placeholder:text-fog focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-black/6 px-5 py-3.5">
            <button type="button" onClick={close} className="rounded-full px-4 py-2 text-sm text-stone hover:bg-black/5">
              انصراف
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="flex items-center gap-2 rounded-full bg-sage px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-sage-deep disabled:opacity-40"
            >
              {isPending && <Spinner size={13} />}
              ذخیره
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
