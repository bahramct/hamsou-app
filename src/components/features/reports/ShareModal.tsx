"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ShareModal — مودالِ اشتراک‌گذاری گزارش هفتگی (DECISION-052 → DECISION-054 → DECISION-056)
//
// دانلود تصویر: client-side (html-to-image) — فارسی/RTL کاملاً درست از browser renderer.
// پیش‌نمایش: همان canvas کامپوننت‌ها، scale‌شده با CSS transform.
// OG image (/share/[id]): همچنان server-side Satori (BrandCard ساده).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { toast } from "@/lib/notifications/toast";
import { buildShareUrl } from "@/lib/utils/app-url";
import { Spinner } from "@/components/ui/Spinner";
import { ShareCardCanvas } from "@/components/features/reports/ShareCardCanvas";
import { SharePosterCanvas } from "@/components/features/reports/SharePosterCanvas";
import type { ShareImageData } from "@/lib/reports/share-image";

interface Props {
  reportId: string;
  weekLabel: string;
  isOpen: boolean;
  initialShared: boolean;
  onClose: () => void;
  onSharedChange: (shared: boolean) => void;
}

const SHARE_TEXT = "گزارش هفتگی من در همسو";

type ImageFormat = "card" | "poster";

const CANVAS_SIZE = {
  card: { w: 1200, h: 630 },
  poster: { w: 1080, h: 2040 },
} as const;

// ─── targetهای انتشار ────────────────────────────────────────────────────────

type ShareTarget = {
  key: string;
  label: string;
  color: string;
  icon: React.ReactNode;
  intent?: (url: string, text: string) => string;
  copyOnly?: boolean;
  copyHint?: string;
};

const TARGETS: ShareTarget[] = [
  {
    key: "twitter",
    label: "ایکس",
    color: "var(--color-ink)",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
    ),
    intent: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    key: "linkedin",
    label: "لینکدین",
    color: "#0A66C2",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
      </svg>
    ),
    intent: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    key: "telegram",
    label: "تلگرام",
    color: "#2AABEE",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M21.94 4.6 18.9 19.05c-.23 1.01-.83 1.26-1.68.79l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73 8.6-7.77c.37-.33-.08-.52-.58-.19l-10.63 6.7-4.58-1.43c-1-.31-1.01-1 .21-1.48l17.9-6.9c.83-.31 1.56.2 1.29 1.47Z" />
      </svg>
    ),
    intent: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    key: "instagram",
    label: "اینستاگرام",
    color: "#C2387A",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
      </svg>
    ),
    copyOnly: true,
    copyHint: "لینک کپی شد — در بیو یا استوری اینستاگرام بگذار",
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export function ShareModal({
  reportId,
  weekLabel,
  isOpen,
  initialShared,
  onClose,
  onSharedChange,
}: Props) {
  const [shared, setShared] = useState(initialShared);
  const [preparing, setPreparing] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [format, setFormat] = useState<ImageFormat>("card");
  const [shareData, setShareData] = useState<ShareImageData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  // اندازهٔ ظرفِ پیش‌نمایش برای محاسبهٔ scale
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(340);
  // refهای canvas برای html-to-image
  const cardRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  const url = buildShareUrl(reportId);

  // ── اندازه‌گیریِ ظرفِ پیش‌نمایش ──────────────────────────────────────────────
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setPreviewWidth(entry.contentRect.width || 340);
    });
    ro.observe(el);
    setPreviewWidth(el.offsetWidth || 340);
    return () => ro.disconnect();
  }, [isOpen]);

  // ── فعال‌سازیِ لینک ──────────────────────────────────────────────────────────
  const ensureShared = useCallback(async () => {
    if (shared) return;
    setPreparing(true);
    try {
      const res = await fetch(`/api/reports/weekly/${reportId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shared: true }),
      });
      if (!res.ok) throw new Error("failed");
      setShared(true);
      onSharedChange(true);
    } catch {
      toast.error("فعال‌سازی لینک ناموفق بود");
    } finally {
      setPreparing(false);
    }
  }, [shared, reportId, onSharedChange]);

  // ── دریافتِ داده‌های canvas ───────────────────────────────────────────────────
  const fetchShareData = useCallback(async () => {
    if (shareData) return;
    setDataLoading(true);
    try {
      const res = await fetch(`/api/reports/weekly/${reportId}/share-data`);
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as ShareImageData;
      setShareData(data);
    } catch {
      toast.error("بارگذاری داده ناموفق بود");
    } finally {
      setDataLoading(false);
    }
  }, [shareData, reportId]);

  useEffect(() => {
    if (isOpen) {
      void ensureShared();
      void fetchShareData();
    }
  }, [isOpen, ensureShared, fetchShareData]);

  // ── QR ───────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 80,
      color: { dark: "#1A1A1F", light: "#ffffff" },
    })
      .then((d) => alive && setQr(d))
      .catch(() => {});
    return () => { alive = false; };
  }, [isOpen, url]);

  // ── Escape + scroll lock ──────────────────────────────────────────────────────
  // قفلِ اسکرول باید روی <html> هم اعمال شود (فقط body کافی نیست — صفحهٔ زیرِ
  // مودال هنگام wheel/touch اسکرول می‌شد). رفتارِ هدف: مثل مودالِ رسید پرداخت.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [isOpen, onClose]);

  useEffect(() => { setMounted(true); }, []);

  function selectFormat(f: ImageFormat) {
    if (f === format) return;
    setFormat(f);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.neutral("لینک کپی شد");
    } catch {
      toast.error("کپی ناموفق بود");
    }
  }

  async function download() {
    if (!shareData) return;
    setDownloading(true);
    try {
      await document.fonts.ready;
      const ref = format === "card" ? cardRef.current : posterRef.current;
      if (!ref) throw new Error("canvas not ready");
      const dataUrl = await toPng(ref, { pixelRatio: 1, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `hamsoo-weekly-${format}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("تصویر دانلود شد");
    } catch {
      toast.error("دانلود ناموفق بود");
    } finally {
      setDownloading(false);
    }
  }

  function handleTarget(t: ShareTarget) {
    if (t.copyOnly) {
      void navigator.clipboard
        .writeText(url)
        .then(() => toast.neutral(t.copyHint ?? "لینک کپی شد"))
        .catch(() => toast.error("کپی ناموفق بود"));
      return;
    }
    if (t.intent) {
      window.open(t.intent(url, SHARE_TEXT), "_blank", "noopener,noreferrer,width=620,height=560");
    }
  }

  async function nativeShare() {
    try {
      if (shareData && typeof navigator.canShare === "function") {
        await document.fonts.ready;
        const ref = format === "card" ? cardRef.current : posterRef.current;
        if (ref) {
          const dataUrl = await toPng(ref, { pixelRatio: 1, cacheBust: true });
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], `hamsoo-weekly-${format}.png`, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: SHARE_TEXT, text: SHARE_TEXT });
            return;
          }
        }
      }
      if (typeof navigator.share === "function") {
        await navigator.share({ title: SHARE_TEXT, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.neutral("لینک کپی شد");
    } catch {
      // کاربر لغو کرد یا پشتیبانی نشد
    }
  }

  async function stopSharing() {
    setReverting(true);
    try {
      const res = await fetch(`/api/reports/weekly/${reportId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shared: false }),
      });
      if (!res.ok) throw new Error("failed");
      setShared(false);
      onSharedChange(false);
      toast.neutral("اشتراک‌گذاری لغو شد — لینک دیگر در دسترس نیست");
      onClose();
    } catch {
      toast.error("خطا — دوباره تلاش کن");
    } finally {
      setReverting(false);
    }
  }

  // scale برای پیش‌نمایش: canvas پر-عرض در ارتفاع 165px
  const canvasW = CANVAS_SIZE[format].w;
  const previewScale = previewWidth / canvasW;
  const previewH = Math.round(CANVAS_SIZE[format].h * previewScale);
  const clampedH = Math.min(previewH, 165);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`sharem-overlay${isOpen ? " open" : ""}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-hidden={!isOpen}
    >
      <div
        className="sharem-panel"
        role="dialog"
        aria-modal="true"
        aria-label="اشتراک‌گذاری و دانلود گزارش هفتگی"
      >
        {/* ① هدر */}
        <div className="sm-rise sm-d1 flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-ink">اشتراک‌گذاری و دانلود</h2>
            <p className="text-xs text-stone mt-1 leading-relaxed">
              لینک و تصویر اجتماعی ساخته شد. کپی، دانلود یا مستقیم منتشر کن.
            </p>
          </div>
          <button type="button" className="sharem-close" onClick={onClose} aria-label="بستن">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ② پیش‌نمایشِ canvas + سوییچِ فرمت + دانلود */}
        <div className="sm-rise sm-d2 mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] text-fog uppercase tracking-widest fa-num">
              {weekLabel}
            </span>
            <div className="sharem-seg" role="group" aria-label="فرمتِ تصویر">
              <button
                type="button"
                className={format === "card" ? "active" : ""}
                onClick={() => selectFormat("card")}
              >
                کارت
              </button>
              <button
                type="button"
                className={format === "poster" ? "active" : ""}
                onClick={() => selectFormat("poster")}
              >
                پوستر
              </button>
            </div>
          </div>

          {/* ظرفِ پیش‌نمایش */}
          <div className="sharem-preview">
            <div
              ref={previewContainerRef}
              style={{
                height: clampedH || 165,
                overflow: "hidden",
                position: "relative",
                background: "rgba(var(--rgb-paper),0.45)",
                borderRadius: "12px 12px 0 0",
              }}
            >
              {/* canvas پیش‌نمایش — scale شده */}
              {shareData ? (
                <div
                  style={{
                    transformOrigin: "top right",
                    transform: `scale(${previewScale})`,
                    width: canvasW,
                  }}
                >
                  {format === "card" ? (
                    <ShareCardCanvas data={shareData} />
                  ) : (
                    <SharePosterCanvas data={shareData} />
                  )}
                </div>
              ) : (
                <span className="sharem-skeleton" />
              )}

              {/* محو ملایم پایین */}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 52,
                  background: "linear-gradient(to bottom, transparent, rgba(var(--rgb-card),0.90))",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-t border-black/6">
              <div className="min-w-0">
                <p className="text-[11px] text-stone">
                  {format === "card" ? "کارتِ فشرده" : "پوسترِ کامل"}
                </p>
                <p className="text-[10px] text-fog fa-num">
                  {format === "card" ? "۱۲۰۰×۶۳۰" : "۱۰۸۰×۲۰۴۰"}
                </p>
              </div>
              <button
                type="button"
                onClick={download}
                disabled={!shareData || downloading || dataLoading}
                className="btn-glass shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium disabled:opacity-40"
              >
                {downloading && <Spinner size={13} />}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 3v12M7 10l5 5 5-5M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                دانلود
              </button>
            </div>
          </div>
        </div>

        {/* ③ لینک + کپی */}
        <div className="sm-rise sm-d3 flex items-center gap-2 mb-4">
          <span dir="ltr" className="sharem-field truncate num-latin">
            {preparing ? "در حال آماده‌سازی لینک…" : url}
          </span>
          <button
            type="button"
            onClick={copyLink}
            disabled={preparing}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-ink text-paper hover:bg-charcoal active:scale-95 transition-all duration-150 disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            کپی
          </button>
        </div>

        {/* ④ شبکه‌ها + QR */}
        <div className="sm-rise sm-d4 flex items-center justify-between gap-4 mb-2">
          <div className="min-w-0">
            <p className="text-[10px] text-fog uppercase tracking-widest mb-2.5">انتشار مستقیم</p>
            <div className="flex flex-wrap gap-2">
              {TARGETS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleTarget(t)}
                  disabled={preparing}
                  className="sharem-tile"
                  style={{ color: t.color }}
                  title={t.label}
                  aria-label={t.label}
                >
                  {t.icon}
                </button>
              ))}
              <button
                type="button"
                onClick={nativeShare}
                disabled={preparing}
                className="sharem-tile"
                style={{ color: "var(--color-stone)" }}
                title="اشتراکِ سیستمی"
                aria-label="اشتراکِ سیستمی"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
          <div className="sharem-qr shrink-0" aria-label="کد QR لینک">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} width={80} height={80} alt="کد QR" />
            ) : (
              <span style={{ display: "block", width: 80, height: 80 }} />
            )}
          </div>
        </div>

        {/* ⑤ حریم خصوصی + لغو */}
        <div className="sm-rise sm-d5 pt-3 mt-2 border-t border-black/6">
          <p className="text-[11px] text-fog leading-relaxed mb-2">
            هر کسی که این لینک را داشته باشد می‌تواند این گزارش را ببیند. هیچ اطلاعات خصوصی‌ای
            (شماره، پلن) در صفحهٔ عمومی نیست.
          </p>
          {shared && (
            <button
              type="button"
              onClick={stopSharing}
              disabled={reverting}
              className="text-xs text-fog hover:text-ember transition-colors disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              {reverting && <Spinner size={12} />}
              لغو اشتراک‌گذاری و خصوصی کردن
            </button>
          )}
        </div>

        {/* canvasهای hidden برای download (off-screen) */}
        {shareData && (
          <div
            aria-hidden
            style={{ position: "fixed", left: -9999, top: 0, pointerEvents: "none", zIndex: -1 }}
          >
            <div ref={cardRef}>
              <ShareCardCanvas data={shareData} />
            </div>
            <div ref={posterRef}>
              <SharePosterCanvas data={shareData} />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
