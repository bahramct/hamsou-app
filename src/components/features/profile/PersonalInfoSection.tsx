"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PersonalInfoSection — ویرایش نام نمایشی و بیوگرافی
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

interface Props {
  displayName: string | null;
  bio: string | null;
  companionName: string | null;
}

export function PersonalInfoSection({ displayName: initName, bio: initBio, companionName: initCompanion }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initName ?? "");
  const [bio, setBio] = useState(initBio ?? "");
  const [companion, setCompanion] = useState(initCompanion ?? "");
  const [error, setError] = useState<string | null>(null);

  const companionDisplayed = companion.trim() || "همدم";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      // یک ذخیرهٔ واحد برای همهٔ موارد: نام نمایشی + بیوگرافی + نام همدم
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name.trim() || null,
          bio: bio.trim() || null,
          companionName: companion.trim() || null,
        }),
      });
      const data = await res.json() as { ok: boolean; message?: string };

      if (!res.ok || !data.ok) {
        setError(data.message ?? "خطایی رخ داد");
        return;
      }
      toast.success("ذخیره شد");
      router.refresh();
    });
  }

  return (
    <section className="glass rounded-2xl p-6">
      <div className="space-y-0.5 mb-5">
        <h2 className="text-sm font-semibold text-ink">اطلاعات شخصی</h2>
        <p className="text-xs text-fog">این اطلاعات فقط برای خودت نمایش داده می‌شود</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* نام نمایشی */}
        <div className="space-y-1.5">
          <label htmlFor="displayName" className="text-xs text-stone">
            نام نمایشی <span className="text-fog/60">(اختیاری)</span>
          </label>
          <input
            id="displayName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="چطور می‌خواهی صدایت کنم؟"
            className="w-full rounded-xl border border-black/10 bg-paper/60 px-4 py-2.5
                       text-sm text-ink placeholder:text-fog/50
                       focus:outline-none focus:border-stone/50 transition-colors"
            dir="rtl"
          />
        </div>

        {/* بیوگرافی */}
        <div className="space-y-1.5">
          <label htmlFor="bio" className="text-xs text-stone">
            بیوگرافی <span className="text-fog/60">(اختیاری)</span>
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="چند جمله درباره خودت..."
            className="w-full rounded-xl border border-black/10 bg-paper/60 px-4 py-2.5
                       text-sm text-ink placeholder:text-fog/50 resize-none
                       focus:outline-none focus:border-stone/50 transition-colors leading-relaxed"
            dir="rtl"
          />
          {bio.length > 160 && (
            <p className="text-[11px] text-fog fa-num text-left">
              {200 - bio.length} کاراکتر باقی‌مانده
            </p>
          )}
        </div>

        {/* نام همدم — پیش‌تر بخش جدا بود؛ حالا اینجا با یک ذخیرهٔ واحد */}
        <div className="space-y-1.5 pt-1 border-t border-black/5">
          <label htmlFor="companionName" className="text-xs text-stone pt-3 block">
            نام همدم <span className="text-fog/60">(دستیار چت)</span>
          </label>
          <input
            id="companionName"
            type="text"
            value={companion}
            onChange={(e) => setCompanion(e.target.value)}
            maxLength={30}
            placeholder="همدم"
            className="w-full rounded-xl border border-black/10 bg-paper/60 px-4 py-2.5
                       text-sm text-ink placeholder:text-fog/50
                       focus:outline-none focus:border-stone/50 transition-colors"
            dir="rtl"
          />
          <p className="text-[11px] text-fog">
            در چت با نام «{companionDisplayed}» نمایش داده می‌شود
          </p>
        </div>

        {error && <p className="text-xs text-ember">{error}</p>}

        <div className="flex justify-start">
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isPending && <Spinner />}
            ذخیره
          </button>
        </div>
      </form>
    </section>
  );
}
