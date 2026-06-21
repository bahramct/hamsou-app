"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadcastPanel — ارسال اطلاعیه همگانی (owner only) — DECISION-109
// POST /api/admin/broadcast/notify
// segment: "all" | "FREE" | "PLUS" | "PRO"
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

type Segment = "all" | "FREE" | "PLUS" | "PRO";

const SEGMENTS: { k: Segment; label: string }[] = [
  { k: "all", label: "همه کاربران" },
  { k: "FREE", label: "فقط رایگان" },
  { k: "PLUS", label: "فقط پلاس" },
  { k: "PRO", label: "فقط پرو" },
];

export function BroadcastPanel() {
  const [segment, setSegment] = useState<Segment>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSent, setLastSent] = useState<number | null>(null);

  async function submit() {
    if (saving) return;
    if (!title.trim()) {
      toast.error("عنوان اعلان اجباری است.");
      return;
    }

    setSaving(true);
    setLastSent(null);
    try {
      const res = await fetch("/api/admin/broadcast/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim() || undefined,
          link: link.trim() || undefined,
          segment,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "ارسال اطلاعیه ناموفق بود.");
        return;
      }
      setLastSent(data.sent ?? 0);
      toast.success(`اطلاعیه برای ${(data.sent ?? 0).toLocaleString("fa-IR")} کاربر ارسال شد.`);
      setTitle("");
      setBody("");
      setLink("");
    } catch {
      toast.error("اتصال به سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* بخش کاربران */}
      <div className="rounded-2xl border border-black/8 bg-white/45 p-5 space-y-4">
        <p className="text-[11px] text-fog uppercase tracking-widest">بخش کاربران</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SEGMENTS.map((s) => (
            <button
              key={s.k}
              type="button"
              onClick={() => setSegment(s.k)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                segment === s.k
                  ? "bg-ink text-paper border-ink"
                  : "bg-white/60 border-bone text-stone hover:border-stone/50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* محتوای اعلان */}
      <div className="rounded-2xl border border-black/8 bg-white/45 p-5 space-y-4">
        <p className="text-[11px] text-fog uppercase tracking-widest">محتوای اعلان</p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 200))}
          dir="rtl"
          placeholder="عنوان اعلان (اجباری)"
          className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage transition-all"
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 1000))}
          dir="rtl"
          rows={4}
          placeholder="متن اعلان (اختیاری)"
          className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage transition-all resize-none"
        />

        <input
          value={link}
          onChange={(e) => setLink(e.target.value.slice(0, 500))}
          dir="ltr"
          placeholder="لینک (اختیاری — مثل /plans)"
          className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage transition-all"
        />
      </div>

      {/* ارسال */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
        >
          {saving && <Spinner />}
          ارسال اطلاعیه
        </button>

        {lastSent !== null && (
          <p className="text-sm text-stone">
            ارسال‌شده برای{" "}
            <span className="font-medium text-ink fa-num">
              {lastSent.toLocaleString("fa-IR")}
            </span>{" "}
            کاربر
          </p>
        )}
      </div>
    </div>
  );
}
