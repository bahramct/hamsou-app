"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AvatarSection — آپلود تصویر + انتخاب رنگ preset
// - آپلود: Canvas API (بدون کتابخانه خارجی) → JPEG ≤400px @ 0.78 quality
// - رنگ: ۱۲ preset با ذخیره‌ی auto-save، sage سبز به‌عنوان پیش‌فرض
// DECISION-056
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AVATAR_PRESETS, getPreset } from "@/lib/profile/avatarPresets";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";

interface Props {
  currentPreset: number;
  avatarImage: string | null;
  displayName: string | null;
}

export function AvatarSection({ currentPreset: initialPreset, avatarImage: initialImage, displayName }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState(initialPreset);
  const [previewImage, setPreviewImage] = useState<string | null>(initialImage);
  const [savingPreset, setSavingPreset] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const initialLetter = displayName?.trim()?.[0] ?? "ه";
  const preset = getPreset(selected);
  const busy = savingPreset !== null || uploading;

  async function pickPreset(index: number) {
    if (index === selected || busy) return;
    setSavingPreset(index);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarPreset: index }),
      });
      if (res.ok) {
        setSelected(index);
        router.refresh();
      } else {
        toast.error("ذخیره رنگ ناموفق بود");
      }
    } finally {
      setSavingPreset(null);
    }
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
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarImage: compressed }),
      });
      if (res.ok) {
        toast.success("تصویر ذخیره شد");
        router.refresh();
      } else {
        const d = (await res.json()) as { message?: string };
        toast.error(d.message ?? "آپلود ناموفق بود");
        setPreviewImage(initialImage);
      }
    } catch {
      toast.error("اتصال برقرار نشد");
      setPreviewImage(initialImage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeImage() {
    if (!previewImage || busy) return;
    setUploading(true);
    setPreviewImage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarImage: null }),
      });
      if (res.ok) {
        toast.success("تصویر حذف شد");
        router.refresh();
      } else {
        setPreviewImage(initialImage);
        toast.error("حذف ناموفق بود");
      }
    } catch {
      setPreviewImage(initialImage);
      toast.error("اتصال برقرار نشد");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="glass rounded-2xl p-6 space-y-5">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold text-ink">آواتار</h2>
        <p className="text-xs text-fog">تصویر آپلود کن یا یک رنگ انتخاب کن</p>
      </div>

      {/* پیش‌نمایش + آپلود */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative group">
          <div
            className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-semibold shadow-paper-md select-none"
            style={previewImage ? {} : { backgroundColor: preset.bg, color: preset.fg }}
          >
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewImage} alt="آواتار" className="w-full h-full object-cover" />
            ) : (
              initialLetter
            )}
          </div>

          {/* overlay هنگام hover */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            aria-label="آپلود عکس"
            className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Spinner />
            ) : (
              <CameraIcon />
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* دکمه‌های عمل */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="text-xs text-stone hover:text-ink transition-colors px-3 py-1.5 rounded-lg border border-black/10 hover:border-black/20 disabled:opacity-50"
          >
            آپلود عکس
          </button>
          {previewImage && (
            <button
              type="button"
              onClick={removeImage}
              disabled={busy}
              className="text-xs text-ember/70 hover:text-ember transition-colors px-3 py-1.5 rounded-lg border border-ember/20 hover:border-ember/40 disabled:opacity-50"
            >
              حذف عکس
            </button>
          )}
        </div>
      </div>

      {/* جداکننده */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-black/6" />
        <span className="text-[11px] text-fog">یا رنگ انتخاب کن</span>
        <div className="flex-1 h-px bg-black/6" />
      </div>

      {/* گرید ۴ ستونی رنگ‌ها */}
      <div className="grid grid-cols-4 gap-3">
        {AVATAR_PRESETS.map((p, i) => {
          const isActive = i === selected && !previewImage;
          const isSaving = savingPreset === i;
          const isSage = i === 3;

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => void pickPreset(i)}
                disabled={busy}
                aria-label={`رنگ ${i + 1}${isSage ? " — پیش‌فرض" : ""}`}
                className="relative w-full aspect-square rounded-xl transition-all duration-200 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{ backgroundColor: p.bg }}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-xl ring-2 ring-offset-2 ring-ink/50" />
                )}
                {isSaving && (
                  <span
                    className="absolute inset-0 rounded-xl animate-pulse"
                    style={{ backgroundColor: p.fg + "50" }}
                  />
                )}
              </button>
              {isSage && (
                <span className="text-[9px] text-stone/70 leading-none">پیش‌فرض</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── ایکون دوربین ────────────────────────────────────────────────────────────
function CameraIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// ─── فشرده‌سازی تصویر با Canvas API — بدون کتابخانه خارجی ──────────────────
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
