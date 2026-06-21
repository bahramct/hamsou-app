"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AdminNotifyUser — ارسال نوتیف مستقیم ادمین به یک کاربر خاص (DECISION-109)
// POST /api/admin/users/[id]/notify
// عنوان اجباری؛ متن و لینک اختیاری.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

export function AdminNotifyUser({ userId }: { userId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (saving) return;
    if (!title.trim()) {
      toast.error("عنوان اعلان اجباری است.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim() || undefined,
          link: link.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "ارسال اعلان ناموفق بود.");
        return;
      }
      toast.success("اعلان ارسال شد.");
      setTitle("");
      setBody("");
      setLink("");
      startTransition(() => router.refresh());
    } catch {
      toast.error("اتصال به سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-fog uppercase tracking-widest">ارسال اعلان به کاربر</p>

      {/* عنوان */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 200))}
        dir="rtl"
        placeholder="عنوان اعلان (اجباری)"
        className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage transition-all"
      />

      {/* متن */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 1000))}
        dir="rtl"
        rows={3}
        placeholder="متن اعلان (اختیاری)"
        className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage transition-all resize-none"
      />

      {/* لینک */}
      <input
        value={link}
        onChange={(e) => setLink(e.target.value.slice(0, 500))}
        dir="ltr"
        placeholder="لینک (اختیاری — مثل /plans)"
        className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage transition-all"
      />

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
      >
        {saving && <Spinner />}
        ارسال اعلان
      </button>
    </div>
  );
}
