"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AvatarCropModal — کراپرِ اختصاصیِ همسو (DECISION-057/059/060)
//
// کادرِ برشِ مربعی + zoom (slider / ± تا ۴×) + pan (کشیدنِ خارج از کادر).
// ساختار: viewport (overflow:hidden, اندازهٔ ثابت) ← inner (اندازهٔ zoom‌شده + pan)
// ← img + کادرِ برش. بدونِ کتابخانهٔ خارجی؛ خروجی JPEG سقفِ ۵۱۲px.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";

interface Props {
  source: string;
  onCancel: () => void;
  onCropped: (dataUrl: string) => void;
}

const MAX_OUTPUT = 512;
const QUALITY    = 0.9;
const MIN_BOX    = 64;
const MIN_ZOOM   = 1;
const MAX_ZOOM   = 4;
const ZOOM_STEP  = 0.25;

type Corner = "tl" | "tr" | "bl" | "br";
interface Box  { x: number; y: number; size: number }
interface Size { w: number; h: number }
interface Pan  { x: number; y: number }
type Gesture =
  | { type: "move";   startX: number; startY: number; box: Box  }
  | { type: "resize"; corner: Corner;                 box: Box  }
  | { type: "pan";    startX: number; startY: number; startPan: Pan };

// ── کمکی‌ها ────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(v, Math.max(lo, hi)));
}

function clampPan(p: Pan, fit: Size, z: number): Pan {
  const dw = fit.w * z;
  const dh = fit.h * z;
  return {
    x: Math.max(fit.w - dw, Math.min(0, p.x)),
    y: Math.max(fit.h - dh, Math.min(0, p.y)),
  };
}

function cornerCursor(c: Corner): React.CSSProperties {
  const base: React.CSSProperties = { touchAction: "none", position: "absolute" };
  const off = 3;
  if (c === "tl") return { ...base, left:  off, top:    off, cursor: "nwse-resize" };
  if (c === "tr") return { ...base, right: off, top:    off, cursor: "nesw-resize" };
  if (c === "bl") return { ...base, left:  off, bottom: off, cursor: "nesw-resize" };
  return                  { ...base, right: off, bottom: off, cursor: "nwse-resize" };
}

// ── کامپوننت اصلی ──────────────────────────────────────────────────────────
export function AvatarCropModal({ source, onCancel, onCropped }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null); // viewport
  const imgRef  = useRef<HTMLImageElement>(null);

  const [fitSize,    setFitSize]    = useState<Size | null>(null);
  const [zoom,       setZoom]       = useState(MIN_ZOOM);
  const [pan,        setPan]        = useState<Pan>({ x: 0, y: 0 });
  const [box,        setBox]        = useState<Box>({ x: 0, y: 0, size: 0 });
  const [processing, setProcessing] = useState(false);

  const gesture = useRef<Gesture | null>(null);

  // اندازهٔ فعلی تصویر = fitSize × zoom
  const disp: Size | null = fitSize
    ? { w: Math.round(fitSize.w * zoom), h: Math.round(fitSize.h * zoom) }
    : null;

  // ── اندازه‌گیری اولیه هنگام load تصویر ──────────────────────────────────
  const measure = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const rw = img.clientWidth;
    const rh = img.clientHeight;
    if (!rw || !rh) return;
    setFitSize(prev => prev ?? { w: rw, h: rh });
    setBox(prev => {
      if (prev.size > 0) return prev;
      const size = Math.round(Math.min(rw, rh) * 0.8);
      return { size, x: Math.round((rw - size) / 2), y: Math.round((rh - size) / 2) };
    });
  }, []);

  // تبدیلِ مختصاتِ صفحه به فضایِ تصویر (با احتسابِ pan)
  function screenToImg(cx: number, cy: number) {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: clamp(cx - rect.left  - pan.x, 0, disp!.w),
      y: clamp(cy - rect.top   - pan.y, 0, disp!.h),
    };
  }

  // ── ژست‌ها ──────────────────────────────────────────────────────────────
  function onViewportDown(e: React.PointerEvent) {
    if (!disp) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    gesture.current = { type: "pan", startX: e.clientX, startY: e.clientY, startPan: { ...pan } };
  }

  function startMove(e: React.PointerEvent) {
    e.preventDefault(); e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    gesture.current = { type: "move", startX: e.clientX, startY: e.clientY, box: { ...box } };
  }

  function startResize(e: React.PointerEvent, corner: Corner) {
    e.preventDefault(); e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    gesture.current = { type: "resize", corner, box: { ...box } };
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g || !disp || !fitSize) return;

    if (g.type === "pan") {
      const dx = e.clientX - g.startX, dy = e.clientY - g.startY;
      setPan(clampPan({ x: g.startPan.x + dx, y: g.startPan.y + dy }, fitSize, zoom));
      return;
    }

    if (g.type === "move") {
      const dx = e.clientX - g.startX, dy = e.clientY - g.startY;
      setBox({
        size: g.box.size,
        x: clamp(g.box.x + dx, 0, disp.w - g.box.size),
        y: clamp(g.box.y + dy, 0, disp.h - g.box.size),
      });
      return;
    }

    // resize — گوشهٔ مقابل ثابت، مربع بزرگ/کوچک می‌شود
    const p = screenToImg(e.clientX, e.clientY);
    const b = g.box;
    let next: Box;
    switch (g.corner) {
      case "br": { const ax=b.x,ay=b.y; const s=clamp(Math.max(p.x-ax,p.y-ay),MIN_BOX,Math.min(disp.w-ax,disp.h-ay)); next={x:ax,y:ay,size:s}; break; }
      case "tl": { const ax=b.x+b.size,ay=b.y+b.size; const s=clamp(Math.max(ax-p.x,ay-p.y),MIN_BOX,Math.min(ax,ay)); next={x:ax-s,y:ay-s,size:s}; break; }
      case "tr": { const ax=b.x,ay=b.y+b.size; const s=clamp(Math.max(p.x-ax,ay-p.y),MIN_BOX,Math.min(disp.w-ax,ay)); next={x:ax,y:ay-s,size:s}; break; }
      case "bl": { const ax=b.x+b.size,ay=b.y; const s=clamp(Math.max(ax-p.x,p.y-ay),MIN_BOX,Math.min(ax,disp.h-ay)); next={x:ax-s,y:ay,size:s}; break; }
    }
    setBox(next!);
  }

  function endGesture(e: React.PointerEvent) {
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /**/ }
    gesture.current = null;
  }

  // ── zoom ─────────────────────────────────────────────────────────────────
  function applyZoom(newZoom: number) {
    if (!fitSize) return;
    const z = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
    const dw = fitSize.w * z, dh = fitSize.h * z;
    setPan(prev => clampPan(prev, fitSize, z));
    setBox(prev => {
      const size = Math.min(prev.size, dw, dh);
      return { size, x: clamp(prev.x, 0, dw-size), y: clamp(prev.y, 0, dh-size) };
    });
    setZoom(z);
  }

  // ── تأیید و canvas ───────────────────────────────────────────────────────
  async function confirm() {
    const img = imgRef.current;
    if (!img || !disp || !box.size || processing) return;
    setProcessing(true);
    try {
      const scale = img.naturalWidth / disp.w;
      const sx = box.x * scale, sy = box.y * scale, sSize = box.size * scale;
      const out = Math.min(Math.round(sSize), MAX_OUTPUT);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = out;
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

  const isZoomed = zoom > MIN_ZOOM + 0.01;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in"
      role="dialog" aria-modal="true" aria-label="برشِ تصویرِ آواتار"
      onClick={(e) => { if (e.target === e.currentTarget && !processing) onCancel(); }}
    >
      <div className="glass-strong rounded-3xl w-full max-w-md overflow-hidden animate-fade-up">

        {/* ─── سرتیتر ─── */}
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-ink">برشِ تصویر</h2>
          <p className="text-xs text-fog mt-0.5">
            {isZoomed
              ? "خارج از کادر را بکش تا تصویر جابه‌جا شود"
              : "کادر را جابه‌جا کن یا از گوشه‌ها اندازه‌اش را تغییر بده"}
          </p>
        </div>

        {/* ─── viewport ─── */}
        <div className="px-6 flex justify-center">
          <div
            ref={wrapRef}
            style={fitSize ? { width: fitSize.w, height: fitSize.h } : {}}
            className={[
              "relative overflow-hidden rounded-xl select-none touch-none",
              isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-default",
            ].join(" ")}
            onPointerDown={onViewportDown}
            onPointerMove={onPointerMove}
            onPointerUp={endGesture}
            onPointerCancel={endGesture}
          >
            {/* inner — اندازهٔ zoom‌شده، با pan جابه‌جا می‌شود */}
            <div
              style={
                disp
                  ? { position: "absolute", left: pan.x, top: pan.y, width: disp.w, height: disp.h }
                  : { position: "relative" }
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={source}
                alt="تصویر"
                draggable={false}
                onLoad={measure}
                style={
                  disp
                    ? { display: "block", width: disp.w, height: disp.h }
                    : { display: "block", maxHeight: "52vh", maxWidth: "100%" }
                }
              />

              {/* کادرِ برش */}
              {disp && box.size > 0 && (
                <div
                  className="absolute cursor-move"
                  style={{
                    left: box.x, top: box.y,
                    width: box.size, height: box.size,
                    boxShadow: "0 0 0 9999px rgba(26,26,31,0.55)",
                    borderRadius: 12,
                  }}
                  onPointerDown={startMove}
                >
                  <div className="absolute inset-0 rounded-xl ring-2 ring-paper/90" />
                  <div className="absolute inset-1 rounded-full border border-paper/40 pointer-events-none" />
                  {(["tl", "tr", "bl", "br"] as Corner[]).map((c) => (
                    <span
                      key={c}
                      onPointerDown={(e) => startResize(e, c)}
                      className="absolute w-4 h-4 bg-paper rounded-full shadow-paper-sm border border-ink/10"
                      style={cornerCursor(c)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── کنترل zoom ─── */}
        <div className="px-6 pt-4 pb-1">
          <div className="flex items-center gap-3">
            {/* دکمهٔ کاهش */}
            <button
              type="button"
              onClick={() => applyZoom(zoom - ZOOM_STEP)}
              disabled={zoom <= MIN_ZOOM || processing}
              aria-label="کاهش بزرگ‌نمایی"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-black/10
                         hover:border-black/25 hover:bg-black/5 text-stone hover:text-ink
                         transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              <ZoomMinusIcon />
            </button>

            {/* slider */}
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={MIN_ZOOM} max={MAX_ZOOM} step={0.05}
                value={zoom}
                onChange={(e) => applyZoom(Number(e.target.value))}
                disabled={processing}
                aria-label="سطح بزرگ‌نمایی"
                className="w-full h-1.5 appearance-none rounded-full bg-black/10 cursor-pointer
                           disabled:opacity-50 disabled:cursor-not-allowed
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-ink
                           [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:shadow-sm
                           [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                           [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-ink
                           [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>

            {/* دکمهٔ افزایش */}
            <button
              type="button"
              onClick={() => applyZoom(zoom + ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM || processing}
              aria-label="افزایش بزرگ‌نمایی"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-black/10
                         hover:border-black/25 hover:bg-black/5 text-stone hover:text-ink
                         transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              <ZoomPlusIcon />
            </button>

            {/* نمایش مقدار */}
            <span className="text-xs text-fog min-w-[2.8rem] text-center num-latin shrink-0" dir="ltr">
              {zoom.toFixed(1)}×
            </span>
          </div>
        </div>

        {/* ─── دکمه‌های عمل ─── */}
        <div className="flex items-center justify-end gap-2 px-6 py-5">
          <button
            type="button" onClick={onCancel} disabled={processing}
            className="px-4 py-2.5 rounded-xl text-sm text-stone hover:text-ink border border-black/10
                       hover:border-black/20 transition-colors disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button" onClick={confirm} disabled={processing || box.size === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
                       bg-ink text-paper text-sm font-medium hover:bg-charcoal
                       transition-colors disabled:opacity-40"
          >
            {processing && <Spinner />}
            ذخیرهٔ تصویر
          </button>
        </div>
      </div>
    </div>
  );
}

function ZoomMinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 6h4M10 10l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ZoomPlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 4v4M4 6h4M10 10l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
