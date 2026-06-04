"use client";

// ─────────────────────────────────────────────────────────────────────────────
// EditableAvatar — آواتارِ قابلِ‌ویرایش در hero پروفایل (DECISION-057/059)
//
// نمایشِ آواتار (عکس یا رنگِ ثابتِ طلایی) + overlayِ دوربین برای تغییر. کلیک →
// انتخابِ فایل → مودالِ کراپِ اختصاصی → آپلودِ خودکار. حذفِ عکس → بازگشت به طلایی.
// در hero استفاده می‌شود تا کارتِ مجزای آواتار حذف و فضای خالی رفع شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AVATAR_COLOR } from "@/lib/profile/avatarPresets";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { AvatarCropModal } from "@/components/features/profile/AvatarCropModal";

interface Props {
  avatarImage: string | null;
  fallbackLetter: string;
  /** کلاسِ اندازه — پیش‌فرض ۲۴ (hero) */
  className?: string;
}

export function EditableAvatar({ avatarImage, fallbackLetter, className = "w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl" }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(avatarImage);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const color = AVATAR_COLOR;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      toast.error("حجم فایل نباید بیشتر از ۱۲ مگابایت باشد");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error("خواندن فایل ناموفق بود");
    reader.onload = () => setCropSource(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function save(dataUrl: string | null) {
    setCropSource(null);
    setBusy(true);
    const prev = image;
    setImage(dataUrl);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarImage: dataUrl }),
      });
      if (res.ok) {
        toast.success(dataUrl ? "تصویر ذخیره شد" : "تصویر حذف شد");
        router.refresh();
      } else {
        const d = (await res.json()) as { message?: string };
        toast.error(d.message ?? "ذخیره ناموفق بود");
        setImage(prev);
      }
    } catch {
      toast.error("اتصال برقرار نشد");
      setImage(prev);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shrink-0 flex flex-col items-center gap-2">
      <div className={`relative group rounded-full ${className}`}>
        <div
          className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-semibold shadow-paper-md select-none"
          style={image ? {} : { backgroundColor: color.bg, color: color.fg }}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="آواتار" className="w-full h-full object-cover" />
          ) : (
            fallbackLetter
          )}
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label="تغییر عکس"
          className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:cursor-not-allowed"
        >
          {busy ? <Spinner className="text-white" /> : <CameraIcon />}
        </button>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="text-[11px] text-stone hover:text-ink transition-colors disabled:opacity-50"
        >
          {image ? "تغییر عکس" : "افزودن عکس"}
        </button>
        {image && (
          <>
            <span className="text-fog/50 text-[11px]">·</span>
            <button
              type="button"
              onClick={() => void save(null)}
              disabled={busy}
              className="text-[11px] text-ember/70 hover:text-ember transition-colors disabled:opacity-50"
            >
              حذف
            </button>
          </>
        )}
      </div>

      {cropSource && createPortal(
        <AvatarCropModal
          source={cropSource}
          onCancel={() => setCropSource(null)}
          onCropped={(d) => void save(d)}
        />,
        document.body
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
