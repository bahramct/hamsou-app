// ─────────────────────────────────────────────────────────────────────────────
// Toast store — لایهٔ گذرای «یک اتفاق افتاد» (DECISION-046)
//
// Zustand (DECISION-046). از هر جای client با `toast.success(...)` و … قابل
// صدا زدن است — بدون نیاز به hook یا context. رندر توسط <ToastHost> در layout.
//
// تنِ مانیفستی: success = تأییدِ آرام، نه جشن. هیچ ایموجی/تشویق.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";

export type ToastTone = "success" | "error" | "info" | "neutral";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
  duration: number; // ms — مدت نمایش پیش از حذف خودکار
}

interface ToastState {
  toasts: ToastItem[];
  push: (tone: ToastTone, message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const DEFAULT_DURATION = 3500;
const MAX_VISIBLE = 4; // بیش از این، قدیمی‌ترین حذف می‌شود (سکوت بصری)

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (tone, message, duration = DEFAULT_DURATION) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((s) => {
      const next = [...s.toasts, { id, tone, message, duration }];
      return { toasts: next.slice(-MAX_VISIBLE) };
    });
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ─── API راحت — قابل import در هر client component، بدون hook ───────────────────
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().push("success", message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().push("error", message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().push("info", message, duration),
  neutral: (message: string, duration?: number) =>
    useToastStore.getState().push("neutral", message, duration),
};
