// ─────────────────────────────────────────────────────────────────────────────
// TicketThread — رشتهٔ پیام‌های یک تیکت، مشترک بین سمت کاربر و ادمین (DECISION-044)
// پیام‌های «خودِ بیننده» یک‌سو و طرف مقابل سوی دیگر، با تاریخ/زمان جلالی-فارسی.
// ─────────────────────────────────────────────────────────────────────────────

export interface ThreadMessage {
  id: string;
  authorType: string; // "user" | "admin"
  authorLabel: string;
  body: string;
  createdAt: Date;
}

function faDateTime(d: Date): string {
  return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tehran" });
}

export function TicketThread({
  messages,
  mySide,
}: {
  messages: ThreadMessage[];
  mySide: "user" | "admin";
}) {
  return (
    <div className="space-y-3">
      {messages.map((m) => {
        const mine = m.authorType === mySide;
        return (
          <div key={m.id} className={`flex flex-col ${mine ? "items-start" : "items-end"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                mine
                  ? "bg-sage/12 border border-sage/20"
                  : "bg-white/70 border border-black/8"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[11px] font-medium ${m.authorType === "admin" ? "text-ember" : "text-stone"}`}>
                  {m.authorLabel}
                </span>
                <span className="text-[10px] text-fog fa-num">{faDateTime(m.createdAt)}</span>
              </div>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
