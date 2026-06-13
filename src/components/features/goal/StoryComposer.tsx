"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StoryComposer — نوشتنِ استوریِ روزِ جاری (DECISION-082)
// هر روز فقط یک استوری مجاز است:
//   - اگر استوری وجود ندارد: textarea آماده
//   - اگر استوری موجود است: نمایش + دکمهٔ ویرایش (edit mode inline)
// متن دکمه ثابت + Spinner + toast (DECISION-053).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";
import { MOOD_LABELS } from "@/lib/goal/storyboard";
import type { GoalMood, SerializedStory } from "@/types/goal";

const MAX = 4000;
const MOODS: GoalMood[] = ["good", "neutral", "hard"];

interface Props {
  goalId: string;
  todayLabel: string;
  weekdayLabel: string;
  todayStory: SerializedStory | null;
}

export function StoryComposer({ goalId, todayLabel, weekdayLabel, todayStory }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<GoalMood | null>(null);
  const [isPending, startTransition] = useTransition();

  const remaining = MAX - content.length;
  const canSubmit = content.trim().length > 0 && remaining >= 0 && !isPending;

  // ── ثبتِ استوری جدید ───────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/goal/${goalId}/story`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim(), mood }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success("استوریت ثبت شد");
          setContent("");
          setMood(null);
          router.refresh();
        } else {
          toast.error(data.message ?? "مشکلی پیش آمد — دوباره تلاش کن");
        }
      } catch {
        toast.error("اتصال برقرار نشد — دوباره تلاش کن");
      }
    });
  }

  // ── ذخیرهٔ ویرایش استوری موجود ────────────────────────────────────────────
  function handleSaveEdit(newContent: string, newMood: GoalMood | null) {
    if (!todayStory || isPending) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/goal/story/${todayStory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent.trim(), mood: newMood }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success("استوری ویرایش شد");
          setEditing(false);
          router.refresh();
        } else {
          toast.error(data.message ?? "مشکلی پیش آمد");
        }
      } catch {
        toast.error("اتصال برقرار نشد");
      }
    });
  }

  const dateLabel = (
    <span className="text-[11px] text-fog fa-num">
      {weekdayLabel} · {todayLabel}
    </span>
  );

  // ── استوریِ موجود: حالتِ نمایش یا ویرایش ─────────────────────────────────
  if (todayStory && !editing) {
    return (
      <div className="glass-strong rounded-3xl p-5 shadow-paper">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-xs font-medium text-stone">استوریِ امروز</span>
          {dateLabel}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-loose text-ink">{todayStory.content}</p>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-bone pt-3">
          <span className="text-[11px] text-fog">
            {todayStory.mood ? MOOD_LABELS[todayStory.mood] : ""}
          </span>
          <button
            type="button"
            onClick={() => {
              setContent(todayStory.content);
              setMood(todayStory.mood);
              setEditing(true);
            }}
            className="rounded-full border border-bone px-4 py-1.5 text-[12px] text-stone transition-colors hover:border-stone/40 hover:bg-black/3"
          >
            ویرایش
          </button>
        </div>
      </div>
    );
  }

  if (todayStory && editing) {
    return (
      <EditMode
        initial={todayStory}
        content={content}
        mood={mood}
        isPending={isPending}
        dateLabel={dateLabel}
        onContentChange={setContent}
        onMoodChange={setMood}
        onSave={handleSaveEdit}
        onCancel={() => {
          setEditing(false);
          setContent("");
          setMood(null);
        }}
      />
    );
  }

  // ── نوشتنِ استوری جدید ─────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-5 shadow-paper">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs font-medium text-stone">امروز در مسیرت چه گذشت؟</span>
        {dateLabel}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="هرچه دلت می‌خواهد بنویس — از حال‌وهوا تا چالش‌ها و قدم‌های کوچک…"
        rows={4}
        disabled={isPending}
        dir="rtl"
        className="w-full resize-none bg-transparent text-sm leading-loose text-ink placeholder:text-fog focus:outline-none disabled:opacity-50"
      />

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-bone pt-3">
        <div className="flex items-center gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood((cur) => (cur === m ? null : m))}
              className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                mood === m
                  ? "bg-sage/15 text-sage-deep ring-1 ring-sage/30"
                  : "text-fog hover:bg-black/4 hover:text-stone"
              }`}
            >
              {MOOD_LABELS[m]}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center justify-center gap-2 rounded-full bg-sage px-6 py-2.5 text-sm font-medium text-paper shadow-paper transition-all duration-300 hover:bg-sage-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending && <Spinner />}
          ثبت استوری
        </button>
      </div>
    </form>
  );
}

// ─── کامپوننتِ ویرایشِ استوری موجود ─────────────────────────────────────────
function EditMode({
  initial,
  content,
  mood,
  isPending,
  dateLabel,
  onContentChange,
  onMoodChange,
  onSave,
  onCancel,
}: {
  initial: SerializedStory;
  content: string;
  mood: GoalMood | null;
  isPending: boolean;
  dateLabel: React.ReactNode;
  onContentChange: (v: string) => void;
  onMoodChange: (v: GoalMood | null) => void;
  onSave: (content: string, mood: GoalMood | null) => void;
  onCancel: () => void;
}) {
  const canSave = content.trim().length > 0 && content.length <= MAX && !isPending;

  return (
    <div className="glass-strong rounded-3xl p-5 shadow-paper">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs font-medium text-stone">ویرایشِ استوریِ امروز</span>
        {dateLabel}
      </div>

      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        rows={4}
        dir="rtl"
        disabled={isPending}
        autoFocus
        className="w-full resize-none bg-transparent text-sm leading-loose text-ink placeholder:text-fog focus:outline-none disabled:opacity-50"
      />

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-bone pt-3">
        <div className="flex items-center gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onMoodChange(mood === m ? null : m)}
              className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                mood === m
                  ? "bg-sage/15 text-sage-deep ring-1 ring-sage/30"
                  : "text-fog hover:bg-black/4 hover:text-stone"
              }`}
            >
              {MOOD_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-full px-4 py-1.5 text-[12px] text-stone hover:bg-black/5"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={() => onSave(content, mood)}
            disabled={!canSave}
            className="flex items-center gap-2 rounded-full bg-sage px-5 py-1.5 text-[12px] font-medium text-paper transition-colors hover:bg-sage-deep disabled:opacity-40"
          >
            {isPending && <Spinner size={12} />}
            ذخیره
          </button>
        </div>
      </div>
    </div>
  );
}
