"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PersonalInfoSection — تایلِ «اطلاعات شخصی» (بازطراحی DECISION-096)
// نمای خواندنی (نام نمایشی · تاریخ تولد · دربارهٔ من) با «ویرایش» که فرم را باز می‌کند.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { JalaliDatePicker } from "@/components/ui/JalaliDatePicker";

interface Props {
  displayName: string | null;
  bio: string | null;
  /** ISO "yyyy-mm-dd" یا "" برای حالت پیش‌فرض */
  birthDate: string;
}

function formatBirth(iso: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString("fa-IR", { day: "numeric", month: "long", year: "numeric" });
}

export function PersonalInfoSection({
  displayName: initName,
  bio: initBio,
  birthDate: initBirthDate,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initName ?? "");
  const [bio, setBio] = useState(initBio ?? "");
  const [birthDate, setBirthDate] = useState(initBirthDate);
  const [error, setError] = useState<string | null>(null);

  function cancel() {
    setName(initName ?? "");
    setBio(initBio ?? "");
    setBirthDate(initBirthDate);
    setError(null);
    setEditing(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name.trim() || null,
          bio: bio.trim() || null,
          birthDate: birthDate || null,
        }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "خطایی رخ داد");
        return;
      }
      toast.success("ذخیره شد");
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <section className="pf-tile pf-t-personal glass">
      <div className="pf-tile-head">
        <div className="pf-tile-ic ic-pers"><PersonIcon /></div>
        <div>
          <h3>اطلاعات شخصی</h3>
          <div className="sub">نام، معرفی و تاریخ تولد</div>
        </div>
      </div>

      {!editing ? (
        <>
          <div className="pf-field">
            <span className="k">نام نمایشی</span>
            <div className="vrow">
              <span className="val">{initName?.trim() || <span style={{ color: "var(--color-fog)" }}>—</span>}</span>
              <button type="button" className="pf-editlink" onClick={() => setEditing(true)}>ویرایش</button>
            </div>
          </div>
          <div className="pf-field">
            <span className="k">تاریخ تولد</span>
            <div className="vrow">
              <span className="val">{formatBirth(initBirthDate) ?? <span style={{ color: "var(--color-fog)" }}>—</span>}</span>
              <button type="button" className="pf-editlink" onClick={() => setEditing(true)}>ویرایش</button>
            </div>
          </div>
          <div className="pf-bio-field">
            <span className="k" style={{ fontSize: 12, color: "var(--color-stone)" }}>دربارهٔ من</span>
            <div className="v">
              {initBio?.trim() || <span style={{ color: "var(--color-fog)" }}>چیزی ننوشته‌ای.</span>}
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full rounded-xl border border-black/10 bg-paper/60 px-4 py-2.5 text-sm text-ink placeholder:text-fog/50 focus:outline-none focus:border-stone/50 transition-colors"
              dir="rtl"
            />
          </div>

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
              className="w-full rounded-xl border border-black/10 bg-paper/60 px-4 py-2.5 text-sm text-ink placeholder:text-fog/50 resize-none focus:outline-none focus:border-stone/50 transition-colors leading-relaxed"
              dir="rtl"
            />
            {bio.length > 160 && (
              <p className="text-[11px] text-fog fa-num text-left">{200 - bio.length} کاراکتر باقی‌مانده</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-stone">
              تاریخ تولد <span className="text-fog/60">(اختیاری)</span>
            </label>
            <JalaliDatePicker value={birthDate} onChange={setBirthDate} clearable placeholder="انتخاب تاریخ تولد" />
          </div>

          {error && <p className="text-xs text-ember">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary px-6 py-2.5 text-sm disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isPending && <Spinner />}
              ذخیره
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl text-sm text-stone hover:text-ink transition-colors"
            >
              انصراف
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

const ico = { width: 17, height: 17, fill: "none", stroke: "currentColor", strokeWidth: 1.6, viewBox: "0 0 24 24", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function PersonIcon() { return <svg {...ico}><path d="M4 19a8 8 0 0 1 16 0" /><circle cx="12" cy="8" r="4" /></svg>; }
