"use client";

// مودال مسدودسازی / رفعِ مسدودیِ کاربر از صفحهٔ جزئیات ادمین
// الگوی مودال: Portal + انیمیشن + قفلِ اسکرول + Escape (DECISION-085)

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Portal } from "@/components/ui/Portal";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";

interface Props {
  userId: string;
  isBanned: boolean;
  onClose: () => void;
}

export function BanModal({ userId, isBanned, onClose }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  async function handleConfirm() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !isBanned }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "عملیات ناموفق بود.");
        return;
      }
      toast.success(isBanned ? "مسدودی کاربر رفع شد." : "کاربر با موفقیت مسدود شد.");
      router.refresh();
      close();
    } catch {
      toast.error("اتصال به سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Portal>
      <>
        {/* پس‌زمینه */}
        <div
          aria-hidden
          onClick={close}
          className="fixed inset-0 z-50"
          style={{
            background: "rgba(26,26,31,0.28)",
            backdropFilter: visible ? "blur(8px)" : "none",
            opacity: visible ? 1 : 0,
            transition: "opacity 220ms ease, backdrop-filter 220ms ease",
          }}
        />

        {/* کانتینر مرکزدهنده */}
        <div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-5"
          role="dialog"
          aria-modal="true"
          aria-label={isBanned ? "رفع مسدودی کاربر" : "مسدودسازی کاربر"}
        >
          <div
            className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-3xl border border-black/8 shadow-[0_20px_60px_rgba(26,26,31,0.18),0_0_0_1px_rgba(255,255,255,0.5)_inset]"
            style={{
              background: "rgba(var(--rgb-paper),0.94)",
              backdropFilter: "blur(28px) saturate(150%)",
              opacity: visible ? 1 : 0,
              transform: visible ? "scale(1)" : "scale(0.94)",
              transition: "opacity 220ms ease, transform 280ms cubic-bezier(0.19,1,0.22,1)",
            }}
          >
            {/* هدر */}
            <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">
                {isBanned ? "رفع مسدودی کاربر" : "مسدودسازی کاربر"}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="بستن"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-fog hover:text-stone hover:bg-black/5 transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M10 2L2 10M2 2l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* محتوا */}
            <div className="px-5 py-5 space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-2xl ${isBanned ? "bg-sage/8 border border-sage/20" : "bg-ember/8 border border-ember/20"}`}>
                <span className={isBanned ? "text-sage-deep" : "text-ember"}>
                  {isBanned ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                      <path d="M9 2a7 7 0 100 14A7 7 0 009 2zm-1 10l-3-3 1.4-1.4L8 9.2l3.6-3.6L13 7l-5 5z" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                      <path d="M9 2a7 7 0 100 14A7 7 0 009 2zm1 10H8V8h2v4zm0-6H8V4h2v2z" fill="currentColor" />
                    </svg>
                  )}
                </span>
                <p className={`text-xs leading-relaxed ${isBanned ? "text-sage-deep" : "text-ember"}`}>
                  {isBanned
                    ? "پس از رفع مسدودی، کاربر دوباره می‌تواند وارد شود."
                    : "پس از مسدودسازی، کاربر دیگر نمی‌تواند وارد شود."}
                </p>
              </div>
              <p className="text-sm text-stone leading-relaxed">
                {isBanned ? "آیا مطمئنی که می‌خواهی مسدودی این کاربر را رفع کنی؟" : "آیا مطمئنی که می‌خواهی این کاربر را مسدود کنی؟"}
              </p>
            </div>

            {/* فوتر */}
            <div className="flex items-center justify-end gap-2 border-t border-black/6 px-5 py-3.5">
              <button
                type="button"
                onClick={close}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm text-stone border border-bone bg-white/60 hover:border-black/15 hover:text-ink transition-all disabled:opacity-40"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-40 ${
                  isBanned
                    ? "bg-sage/15 text-sage-deep hover:bg-sage/25 border-sage/25"
                    : "bg-ember/10 text-ember hover:bg-ember/20 border-ember/20"
                }`}
              >
                {saving && <Spinner size={14} />}
                {isBanned ? "رفع مسدودی" : "مسدودسازی"}
              </button>
            </div>
          </div>
        </div>
      </>
    </Portal>
  );
}
