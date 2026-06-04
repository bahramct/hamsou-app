"use client";

// ─────────────────────────────────────────────────────────────────────────────
// NotificationItem — یک ردیف اعلان (مشترک: ناقوس + صفحهٔ یادآوری‌ها) (DECISION-046)
// رندر کاملاً کاتالوگ‌محور: متن/تن/آیکن/لینک از describeNotification.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { describeNotification, type NotificationTone } from "@/lib/notifications/catalog";
import { NotifIcon } from "./NotifIcon";
import { faRelativeTime } from "@/lib/utils/relative-time";
import type { SerializedNotification } from "@/types/notification";

const TONE_TEXT: Record<NotificationTone, string> = {
  info: "text-stone",
  success: "text-sage",
  neutral: "text-fog",
};

export function NotificationItem({
  n,
  onRead,
  onNavigate,
}: {
  n: SerializedNotification;
  onRead: (id: string) => void;
  onNavigate?: () => void;
}) {
  const d = describeNotification(n.type, n.data, n.linkUrl);
  const unread = n.readAt === null;

  const handleClick = () => {
    if (unread) onRead(n.id);
    onNavigate?.();
  };

  const inner = (
    <div
      className={`flex items-start gap-3 px-4 py-3 transition-colors text-right
        ${unread ? "bg-ember/4 hover:bg-ember/8" : "hover:bg-black/3"}`}
    >
      <span className={`mt-0.5 shrink-0 ${TONE_TEXT[d.tone]}`}>
        <NotifIcon icon={d.icon} />
      </span>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm text-ink leading-snug">{d.title}</p>
        {d.body && <p className="text-xs text-stone leading-relaxed">{d.body}</p>}
        <p className="text-[10px] text-fog fa-num">{faRelativeTime(n.createdAt)}</p>
      </div>
      {unread && <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-ember" aria-label="خوانده‌نشده" />}
    </div>
  );

  if (d.link) {
    return (
      <Link href={d.link} onClick={handleClick} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={handleClick} className="block w-full">
      {inner}
    </button>
  );
}
