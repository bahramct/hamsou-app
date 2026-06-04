"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AdminProfileForm — ویرایش پروفایل شخصی ادمین + تغییر رمز
// دو بخش مستقل: «اطلاعات و آواتار» (PATCH /api/admin/profile) و «تغییر رمز»
// آپلود تصویر آواتار از طریق Canvas API — همترازی ادمین↔پروژه (DECISION-056)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AVATAR_PRESETS, getPreset } from "@/lib/profile/avatarPresets";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

interface InitialProfile {
  displayName: string;
  username: string;
  phone: string;
  avatarPreset: number;
  avatarImage: string | null;
}

export function AdminProfileForm({ initial }: { initial: InitialProfile }) {
  return (
    <div className="space-y-6">
      <InfoSection initial={initial} />
      <PasswordSection />
    </div>
  );
}

// ─── اطلاعات و آواتار ─────────────────────────────────────────────────────────
function InfoSection({ initial }: { initial: InitialProfile }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [username, setUsername] = useState(initial.username);
  const [phone, setPhone] = useState(initial.phone);
  const [avatar, setAvatar] = useState(initial.avatarPreset);
  const [previewImage, setPreviewImage] = useState<string | null>(initial.avatarImage);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const anyBusy = busy || uploading;

  const dirty =
    displayName !== initial.displayName ||
    username !== initial.username ||
    phone !== initial.phone ||
    avatar !== initial.avatarPreset;

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username, phone, avatarPreset: avatar }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { toast.error(d.error ?? "خطا در ذخیره."); return; }
      toast.success("اطلاعات ذخیره شد");
      router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم فایل نباید بیشتر از ۸ مگابایت باشد");
      return;
    }

    setUploading(true);
    let compressed: string;
    try {
      compressed = await compressAvatar(file);
    } catch {
      toast.error("خطا در پردازش تصویر");
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPreviewImage(compressed);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarImage: compressed }),
      });
      const d = (await res.json()) as { error?: string };
      if (res.ok) {
        toast.success("تصویر ذخیره شد");
        router.refresh();
      } else {
        toast.error(d.error ?? "آپلود ناموفق بود");
        setPreviewImage(initial.avatarImage);
      }
    } catch {
      toast.error("اتصال برقرار نشد");
      setPreviewImage(initial.avatarImage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeImage() {
    if (!previewImage || anyBusy) return;
    setUploading(true);
    setPreviewImage(null);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarImage: null }),
      });
      if (res.ok) {
        toast.success("تصویر حذف شد");
        router.refresh();
      } else {
        setPreviewImage(initial.avatarImage);
        toast.error("حذف ناموفق بود");
      }
    } catch {
      setPreviewImage(initial.avatarImage);
      toast.error("اتصال برقرار نشد");
    } finally {
      setUploading(false);
    }
  }

  const preset = getPreset(avatar);

  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5 space-y-5">
      <h2 className="text-sm font-semibold text-ink">اطلاعات و آواتار</h2>

      {/* آواتار — پیش‌نمایش + آپلود + انتخاب رنگ */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          {/* پیش‌نمایش */}
          <div className="relative group shrink-0">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-semibold"
              style={previewImage ? {} : { backgroundColor: preset.bg, color: preset.fg }}
            >
              {previewImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewImage} alt="آواتار" className="w-full h-full object-cover" />
              ) : (
                displayName.slice(0, 1) || "؟"
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={anyBusy}
              aria-label="آپلود عکس"
              className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {uploading ? <Spinner size={16} /> : <SmallCameraIcon />}
            </button>
          </div>

          {/* grid رنگ‌ها */}
          <div className="flex flex-wrap gap-2">
            {AVATAR_PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAvatar(i)}
                disabled={anyBusy}
                aria-label={`آواتار ${i + 1}`}
                className={`w-7 h-7 rounded-lg transition-all ${avatar === i && !previewImage ? "ring-2 ring-offset-2 ring-ink" : "hover:scale-110"}`}
                style={{ backgroundColor: p.bg }}
              />
            ))}
          </div>
        </div>

        {/* دکمه‌های آپلود */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={anyBusy}
            className="text-xs text-stone hover:text-ink transition-colors px-2.5 py-1 rounded-lg border border-black/10 hover:border-black/20 disabled:opacity-50"
          >
            آپلود عکس
          </button>
          {previewImage && (
            <button
              type="button"
              onClick={removeImage}
              disabled={anyBusy}
              className="text-xs text-red-500/70 hover:text-red-500 transition-colors px-2.5 py-1 rounded-lg border border-red-200 hover:border-red-300 disabled:opacity-50"
            >
              حذف عکس
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* فیلدهای متنی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="نام نمایشی">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inp} />
        </Field>
        <Field label="نام کاربری (برای ورود)">
          <input value={username} onChange={(e) => setUsername(e.target.value)} dir="ltr" className={`${inp} num-latin`} />
        </Field>
        <Field label="تلفن (اختیاری)">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className={inp} />
        </Field>
      </div>

      <button
        onClick={save}
        disabled={anyBusy || !dirty || !displayName.trim() || !username.trim()}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
      >
        {busy && <Spinner />}
        ذخیرهٔ اطلاعات
      </button>
    </section>
  );
}

// ─── تغییر رمز ────────────────────────────────────────────────────────────────
function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (next !== confirm) { toast.error("رمز جدید و تکرارش یکسان نیستند."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { toast.error(d.error ?? "خطا در تغییر رمز."); return; }
      toast.success("رمز با موفقیت تغییر کرد");
      setCurrent(""); setNext(""); setConfirm("");
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">تغییر رمز عبور</h2>
        <p className="text-xs text-fog mt-0.5">حداقل ۱۰ کاراکتر و دست‌کم ۳ نوع از: حروف بزرگ، کوچک، رقم، نماد.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="رمز فعلی">
          <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} dir="ltr" className={inp} />
        </Field>
        <Field label="رمز جدید">
          <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} dir="ltr" className={inp} />
        </Field>
        <Field label="تکرار رمز جدید">
          <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} dir="ltr" className={inp} />
        </Field>
      </div>

      <button
        onClick={submit}
        disabled={busy || !current || !next || !confirm}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
      >
        {busy && <Spinner />}
        تغییر رمز
      </button>
    </section>
  );
}

// ─── استایل و کامپوننت‌های کمکی ──────────────────────────────────────────────
const inp = "w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-stone">{label}</label>
      {children}
    </div>
  );
}

function SmallCameraIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// ─── فشرده‌سازی تصویر با Canvas API (DECISION-056) ───────────────────────────
async function compressAvatar(file: File): Promise<string> {
  const MAX_DIM = 400;
  const QUALITY = 0.78;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("خواندن فایل ناموفق بود"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("پردازش تصویر ناموفق بود"));
      img.onload = () => {
        const ratio = Math.min(MAX_DIM / img.naturalWidth, MAX_DIM / img.naturalHeight, 1);
        const w = Math.round(img.naturalWidth * ratio);
        const h = Math.round(img.naturalHeight * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context unavailable")); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
