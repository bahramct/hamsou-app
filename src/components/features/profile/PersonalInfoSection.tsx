"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PersonalInfoSection — تایلِ «اطلاعات شخصی» (بازطراحی DECISION-096 → DECISION-102)
// ویرایشِ inline ردیف‌به‌ردیف، هم‌شکلِ کارتِ «هویت و ورود» (همان input/دکمه):
//   نام نمایشی · تاریخ تولد · دربارهٔ من — هر کدام «ویرایش» مستقل و ویرایشگرِ inline.
// تاریخ تولد به‌صورتِ جلالیِ «۲۰ مرداد ۱۳۶۱» (بدون جداکنندهٔ هزارگان).
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

type RowKey = "name" | "birth" | "bio";

// input/دکمه دقیقاً هم‌شکلِ کارتِ «هویت و ورود» (IdentityCard)
const inp =
  "w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage transition-colors disabled:opacity-50";
const btn =
  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-ink text-paper text-xs font-medium hover:bg-charcoal transition-colors disabled:opacity-40";

function formatBirth(iso: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;
  // جلالیِ «۲۰ مرداد ۱۳۶۱» — سال بدونِ جداکنندهٔ هزارگان (date formatting گروه‌بندی نمی‌کند)
  return new Date(y, m - 1, d).toLocaleDateString("fa-IR", { day: "numeric", month: "long", year: "numeric" });
}

export function PersonalInfoSection({
  displayName: initName,
  bio: initBio,
  birthDate: initBirthDate,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState<RowKey | null>(null);

  // draftها — فقط ردیفِ باز ویرایش می‌شود؛ بقیه مقدارِ اولیه را نگه می‌دارند
  const [name, setName] = useState(initName ?? "");
  const [bio, setBio] = useState(initBio ?? "");
  const [birthDate, setBirthDate] = useState(initBirthDate);

  function toggle(k: RowKey) {
    // بازکردنِ یک ردیف → draftها را به مقدارِ فعلی برگردان
    setName(initName ?? "");
    setBio(initBio ?? "");
    setBirthDate(initBirthDate);
    setOpen((cur) => (cur === k ? null : k));
  }

  function save() {
    startTransition(async () => {
      try {
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
          toast.error(data.message ?? "خطایی رخ داد");
          return;
        }
        toast.success("ذخیره شد");
        setOpen(null);
        router.refresh();
      } catch {
        toast.error("اتصال برقرار نشد");
      }
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

      {/* نام نمایشی */}
      <div className="pf-field">
        <span className="k">نام نمایشی</span>
        <div className="vrow">
          <span className="val">{initName?.trim() || <span style={{ color: "var(--color-fog)" }}>تنظیم نشده</span>}</span>
          <button type="button" className="pf-editlink" onClick={() => toggle("name")}>
            {open === "name" ? "بستن" : "ویرایش"}
          </button>
        </div>
      </div>
      {open === "name" && (
        <div className="animate-fade-in" style={{ padding: "2px 0 12px" }}>
          <div className="space-y-2">
            <input
              dir="rtl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              disabled={isPending}
              placeholder="چطور می‌خواهی صدایت کنم؟"
              className={inp}
            />
            <button onClick={save} disabled={isPending} className={btn}>
              {isPending && <Spinner />}ذخیره
            </button>
          </div>
        </div>
      )}

      {/* تاریخ تولد */}
      <div className="pf-field">
        <span className="k">تاریخ تولد</span>
        <div className="vrow">
          <span className="val fa-num">{formatBirth(initBirthDate) ?? <span style={{ color: "var(--color-fog)" }}>تنظیم نشده</span>}</span>
          <button type="button" className="pf-editlink" onClick={() => toggle("birth")}>
            {open === "birth" ? "بستن" : "ویرایش"}
          </button>
        </div>
      </div>
      {open === "birth" && (
        <div className="animate-fade-in" style={{ padding: "2px 0 12px" }}>
          <div className="space-y-2">
            <JalaliDatePicker value={birthDate} onChange={setBirthDate} clearable placeholder="انتخاب تاریخ تولد" />
            <button onClick={save} disabled={isPending} className={btn}>
              {isPending && <Spinner />}ذخیره
            </button>
          </div>
        </div>
      )}

      {/* دربارهٔ من — بلوکِ تمام‌عرض با «ویرایش» در سرستون */}
      <div className="pf-bio-field">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <span className="k" style={{ fontSize: 12, color: "var(--color-stone)" }}>دربارهٔ من</span>
          <button type="button" className="pf-editlink" onClick={() => toggle("bio")}>
            {open === "bio" ? "بستن" : "ویرایش"}
          </button>
        </div>
        {open === "bio" ? (
          <div className="animate-fade-in space-y-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              disabled={isPending}
              placeholder="چند جمله درباره خودت…"
              dir="rtl"
              className={`${inp} resize-none leading-relaxed`}
            />
            {bio.length > 160 && (
              <p className="text-[11px] text-fog fa-num text-left">{200 - bio.length} کاراکتر باقی‌مانده</p>
            )}
            <button onClick={save} disabled={isPending} className={btn}>
              {isPending && <Spinner />}ذخیره
            </button>
          </div>
        ) : (
          <div className="v">
            {initBio?.trim() || <span style={{ color: "var(--color-fog)" }}>چیزی ننوشته‌ای.</span>}
          </div>
        )}
      </div>
    </section>
  );
}

const ico = { width: 17, height: 17, fill: "none", stroke: "currentColor", strokeWidth: 1.6, viewBox: "0 0 24 24", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function PersonIcon() { return <svg {...ico}><path d="M4 19a8 8 0 0 1 16 0" /><circle cx="12" cy="8" r="4" /></svg>; }
