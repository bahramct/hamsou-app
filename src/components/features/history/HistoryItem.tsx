import type { HistoryItem as HistoryItemType } from "@/types/history";

interface Props {
  item: HistoryItemType;
}

export function HistoryItem({ item }: Props) {
  const { feedback } = item;

  return (
    <article className="
      rounded-xl border border-fog/30 bg-white/60
      px-4 py-3.5 flex flex-col gap-2
      shadow-[0_1px_3px_rgba(46,44,40,0.05)]
    ">
      {/* سطر اول: تاریخ + وضعیت بازخورد */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-stone font-medium fa-num">
          {item.weekdayLabel}، {item.dateLabel}
        </span>
        <FeedbackBadge feedback={feedback} />
      </div>

      {/* متن تعهد */}
      <p className="text-[14px] text-ink leading-relaxed">{item.content}</p>

      {/* یادداشت بازخورد */}
      {feedback?.note && (
        <p className="text-[12px] text-stone/80 border-r-2 border-fog/50 pr-2.5 leading-relaxed">
          {feedback.note}
        </p>
      )}
    </article>
  );
}

function FeedbackBadge({ feedback }: { feedback: HistoryItemType["feedback"] }) {
  if (!feedback) {
    return (
      <span className="text-[10px] text-fog bg-fog/15 px-2 py-0.5 rounded-full">
        بدون بازخورد
      </span>
    );
  }

  if (feedback.status === "DONE") {
    return (
      <span className="text-[10px] text-ember bg-ember/10 px-2 py-0.5 rounded-full font-medium">
        انجام شد
      </span>
    );
  }

  return (
    <span className="text-[10px] text-stone bg-stone/10 px-2 py-0.5 rounded-full">
      انجام نشد
    </span>
  );
}
