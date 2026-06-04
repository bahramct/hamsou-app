// ─────────────────────────────────────────────────────────────────────────────
// support/chat-transport.ts — لایهٔ انتقالِ چت آنلاین (DECISION-049) — client-safe
//
// پیاده‌سازی فعلی: HTTP polling (سرور اختصاصیِ realtime هنوز نداریم). همهٔ ارتباط
// پنجره با سرور پشت این interface است؛ پس از تهیهٔ سرور می‌توان یک WebSocketTransport
// با همین قرارداد ساخت — بدون لمس UI (فلسفهٔ Adapter).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ChatMessageDTO,
  ChatSessionDTO,
  SupportChatAvailability,
  WorkingHours,
} from "@/lib/support/chat";

export interface SupportChatLoad {
  allowed: boolean;
  availability: SupportChatAvailability;
  online: boolean;
  withinHours: boolean;
  hours: WorkingHours;
  welcome: string;
  sessions: ChatSessionDTO[];
}

export interface SupportChatDelta {
  allowed: boolean;
  availability: SupportChatAvailability;
  online: boolean;
  withinHours: boolean;
  messages: ChatMessageDTO[];
}

export type SendResult =
  | { ok: true; message: ChatMessageDTO }
  | { ok: false; message: string; status: number };

export interface SupportChatTransport {
  load(): Promise<SupportChatLoad>;
  poll(afterIso: string | null): Promise<SupportChatDelta>;
  send(content: string): Promise<SendResult>;
  clear(): Promise<boolean>;
}

// ─── پیاده‌سازی HTTP ──────────────────────────────────────────────────────────
export const httpSupportChatTransport: SupportChatTransport = {
  async load() {
    const res = await fetch("/api/support/chat", { cache: "no-store" });
    return (await res.json()) as SupportChatLoad;
  },

  async poll(afterIso) {
    const qs = afterIso ? `?after=${encodeURIComponent(afterIso)}` : "";
    const res = await fetch(`/api/support/chat/poll${qs}`, { cache: "no-store" });
    return (await res.json()) as SupportChatDelta;
  },

  async send(content) {
    const res = await fetch("/api/support/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.ok) {
      return { ok: true, message: data.message as ChatMessageDTO };
    }
    return {
      ok: false,
      message: typeof data?.message === "string" ? data.message : "ارسال پیام ناموفق بود",
      status: res.status,
    };
  },

  async clear() {
    const res = await fetch("/api/support/chat/clear", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    return res.ok && !!data?.ok;
  },
};
