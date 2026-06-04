"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AvatarCropModal — کراپرِ اختصاصیِ همسو (DECISION-057/059)
//
// بدونِ کتابخانهٔ خارجی، بدونِ zoom/rotate. تعامل: یک کادرِ مربعیِ برش روی تصویرِ
// کامل که کاربر آن را جابه‌جا و با گوشه‌ها کوچک/بزرگ می‌کند — دقیقاً برای «حاشیه
// دارد یا بزرگ است». خروجی: مربعِ باکیفیت (تا ۵۱۲px، JPEG ۰.۹) با حجمِ کنترل‌شده.
//
// همهٔ پردازش سمتِ کلاینت با Canvas؛ خروجی dataURL به والد داده می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";

interface Props {
  source: string; // dataURL تصویرِ خام
  onCancel: () => void;
  onCropped: (dataUrl: string) => void;
}

const MAX_OUTPUT = 512; // سقفِ ابعادِ خروجی (px) — کیفیتِ بالا، حجمِ معقول
const QUALITY = 0.9;
const MIN_BOX = 64; // حداقل اندازهٔ کادرِ برش (px نمایشی)

type Corner = "tl" | "tr" | "bl" | "br";
interface Box { x: number; y: number; size: number }
interface Disp { w: number; h: number }

export function AvatarCropModal({ source, onCancel, onCropped }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [disp, setDisp] = useState<Disp | null>(null);
  const [box, setBox] = useState<Box>({ x: 0, y: 0, size: 0 });
  const [processing, setProcessing] = useState(false);

  // اشاره‌گرِ فعالِ ژست (drag/resize) — در ref تا re-render اضافه نشود
  const gesture = useRef<
    | { type: "move"; startX: number; startY: number; box: Box }
    | { type: "resize"; corner: Corner; box: Box }
    | null
  >(null);

  // اندازه‌گیریِ تصویرِ نمایش‌داده‌شده و مقداردهیِ اولیهٔ کادر (مرکز، ۸۰٪ ضلعِ کوچک)
  const measure = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    if (w === 0 || h === 0) return;
    setDisp({ w, h });
    setBox((prev) => {
      if (prev.size > 0) {
        // فقط clamp روی ابعادِ جدید
        const size = Math.min(prev.size, w, h);
        return {
          size,
          x: Math.max(0, Math.min(prev.x, w - size)),
          y: Math.max(0, Math.min(prev.y, h - size)),
        };
      }
      const size = Math.round(Math.min(w, h) * 0.8);
      return { size, x: Math.round((w - size) / 2), y: Math.round((h - size) / 2) };
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // ── ژست‌ها ──────────────────────────────────────────────────────────────────
  function relPoint(clientX: number, clientY: number) {
    const rect = wrapRef.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, disp!.w));
    const y = Math.max(0, Math.min(clientY - rect.top, disp!.h));
    return { x, y };
  }

  function startMove(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    gesture.current = { type: "move", startX: e.clientX, startY: e.clientY, box };
  }

  function startResize(e: React.PointerEvent, corner: Corner) {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    gesture.current = { type: "resize", corner, box };
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g || !disp) return;

    if (g.type === "move") {
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      const x = Math.max(0, Math.min(g.box.x + dx, disp.w - g.box.size));
      const y = Math.max(0, Math.min(g.box.y + dy, disp.h - g.box.size));
      setBox({ x, y, size: g.box.size });
      return;
    }

    // resize — گوشهٔ مقابل ثابت می‌ماند، ضلع مربع (max دو محور)
    const p = relPoint(e.clientX, e.clientY);
    const b = g.box;
    let next: Box;
    switch (g.corner) {
      case "br": { // لنگر = گوشهٔ بالا-چپ
        const ax = b.x, ay = b.y;
        const size = clamp(Math.max(p.x - ax, p.y - ay), MIN_BOX, Math.min(disp.w - ax, disp.h - ay));
        next = { x: ax, y: ay, size };
        break;
      }
      case "tl": { // لنگر = گوشهٔ پایین-راست
        const ax = b.x + b.size, ay = b.y + b.size;
        const size = clamp(Math.max(ax - p.x, ay - p.y), MIN_BOX, Math.min(ax, ay));
        next = { x: ax - size, y: ay - size, size };
        break;
      }
      case "tr": { // لنگر = گوشهٔ پایین-چپ
        const ax = b.x, ay = b.y + b.size;
        const size = clamp(Math.max(p.x - ax, ay - p.y), MIN_BOX, Math.min(disp.w - ax, ay));
        next = { x: ax, y: ay - size, size };
        break;
      }
      case "bl": { // لنگر = گوشهٔ بالا-راست
        const ax = b.x + b.size, ay = b.y;
        const size = clamp(Math.max(ax - p.x, p.y - ay), MIN_BOX, Math.min(ax, disp.h - ay));
        next = { x: ax - size, y: ay, size };
        break;
      }
    }
    setBox(next);
  }

  function endGesture(e: React.PointerEvent) {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    gesture.current = null;
  }

  // ── خروجی ────────────────────────────────────────────────────────────────────
  async function confirm() {
    const img = imgRef.current;
    if (!img || !disp || box.size === 0 || processing) return;
    setProcessing(true);
    try {
      const scale = img.naturalWidth / disp.w; // disp.w با naturalWidth هم‌نسبت است
      const sx = box.x * scale;
      const sy = box.y * scale;
      const sSize = box.size * scale;
      const out = Math.min(Math.round(sSize), MAX_OUTPUT);

      const canvas = document.createElement("canvas");
      canvas.width = out;
      canvas.height = out;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no ctx");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, out, out);
      onCropped(canvas.toDataURL("image/jpeg", QUALITY));
    } catch {
      toast.error("خطا در پردازش تصویر");
      setProcessing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in"
      role="dialog" aria-modal="true" aria-label="برشِ تصویرِ آواتار"
      onClick={(e) => { if (e.target === e.currentTarget && !processing) onCancel(); }}
    >
      <div className="glass-strong rounded-3xl w-full max-w-md overflow-hidden animate-fade-up">
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-ink">برشِ تصویر</h2>
          <p className="text-xs text-fog mt-0.5">کادر را جابه‌جا کن یا از گوشه‌ها اندازه‌اش را تغییر بده</p>
        </div>

        {/* ناحیهٔ تصویر + کادرِ برش */}
        <div className="px-6 flex justify-center">
          <div
            ref={wrapRef}
            className="relative inline-block leading-none select-none touch-none overflow-hidden rounded-xl"
            onPointerMove={onPointerMove}
            onPointerUp={endGesture}
            onPointerCancel={endGesture}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={source}
              alt="تصویر"
              draggable={false}
              onLoad={measure}
              className="block max-h-[52vh] max-w-full rounded-xl"
            />

            {disp && box.size > 0 && (
              <div
                className="absolute cursor-move"
                style={{
                  left: box.x, top: box.y, width: box.size, height: box.size,
                  boxShadow: "0 0 0 9999px rgba(26,26,31,0.55)",
                  borderRadius: 12,
                }}
                onPointerDown={startMove}
              >
                {/* قابِ روشن + دایرهٔ راهنما (شکلِ نهاییِ آواتار) */}
                <div className="absolute inset-0 rounded-xl ring-2 ring-paper/90" />
                <div className="absolute inset-1 rounded-full border border-paper/40 pointer-events-none" />
                {/* دستگیره‌های گوشه */}
                {(["tl", "tr", "bl", "br"] as Corner[]).map((c) => (
                  <span
                    key={c}
                    onPointerDown={(e) => startResize(e, c)}
                    className="absolute w-4 h-4 bg-paper rounded-full shadow-paper-sm border border-ink/10"
                    style={cornerStyle(c)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* دکمه‌ها */}
        <div className="flex items-center justify-end gap-2 px-6 py-5">
          <button
            type="button" onClick={onCancel} disabled={processing}
            className="px-4 py-2.5 rounded-xl text-sm text-stone hover:text-ink border border-black/10 hover:border-black/20 transition-colors disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button" onClick={confirm} disabled={processing || box.size === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors disabled:opacity-40"
          >
            {processing && <Spinner />}
            ذخیرهٔ تصویر
          </button>
        </div>
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(v, Math.max(min, max)));
}

function cornerStyle(c: Corner): React.CSSProperties {
  // دستگیره‌ها داخلِ کادر می‌نشینند تا با overflow-hidden کلیپ نشوند
  const off = 3;
  const base: React.CSSProperties = { touchAction: "none" };
  if (c === "tl") return { ...base, left: off, top: off, cursor: "nwse-resize" };
  if (c === "tr") return { ...base, right: off, top: off, cursor: "nesw-resize" };
  if (c === "bl") return { ...base, left: off, bottom: off, cursor: "nesw-resize" };
  return { ...base, right: off, bottom: off, cursor: "nwse-resize" };
}
