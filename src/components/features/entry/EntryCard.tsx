"use client";

// ─────────────────────────────────────────────────────────────────────────────
// EntryCard — نمایش تعهد ثبت‌شده روزانه
//
// حالت‌ها:
//   ● view      — نمایش تعهد + دکمه ویرایش (اگر در بازه باشیم)
//   ● editing   — فرم ویرایش (همان کارت)
//   ● locked    — نمایش تعهد + نشانگر قفل (بازه گذشته)
//
// Timer:
//   هر ۳۰ ثانیه canEdit را بررسی می‌کند و اگر بازه تمام شده → UI به locked تغییر می‌کند.
//   interval فقط وقتی entry.canEdit=true زنده است.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { canEdit, editTimeRemaining } from "@/lib/utils/date";
import type { SerializedEntry } from "@/types/entry";

const MIN_CHARS = 5;
const MAX_CHARS = 500;

interface Props {
  entry: SerializedEntry;
  todayLabel: string;
  weekdayLabel: string;
}

export function EntryCard({ entry: initialEntry, todayLabel, weekdayLabel }: Props) {
  const [entry, setEntry] = useState(initialEntry);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(initialEntry.content);
  const [editError, setEditError] = useState<string | null>(null);
  const [editable, setEditable] = useState(initialEntry.canEdit);
  const [timeLeft, setTimeLeft] = useState(() =>
    initialEntry.canEdit ? editTimeRemaining(initialEntry.editableUntil) : "",
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // تایمر — هر ۳۰ ثانیه وضعیت قفل را بررسی می‌کند
  useEffect(() => {
    if (!entry.canEdit) return;
    const tick = () => {
      const still = canEdit(entry.editableUntil);
      setEditable(still);
      setTimeLeft(still ? editTimeRemaining(entry.editableUntil) : "");
      if (!still) setIsEditing(false);
    };
    tick(); // یک بار فوری
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [entry.editableUntil, entry.canEdit]);

  async function handleSaveEdit() {
    const trimmed = editContent.trim();
    if (trimmed.length < MIN_CHARS) {
      setEditError("تعهدت رو بیشتر توضیح بده");
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      setEditError("حداکثر ۵۰۰ کاراکتر");
      return;
    }
    setEditError(null);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/entries/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        });

        if (res.ok) {
          const data = (await res.json()) as { entry: SerializedEntry };
          setEntry(data.entry);
          setIsEditing(false);
          router.refresh();
        } else {
          const data = (await res.json()) as { error?: string; message?: string };
          if (data.error === "entry_locked") {
            setEditable(false);
            setIsEditing(false);
            setEditError(null);
          } else if (data.message) {
            setEditError(data.message);
          } else {
            setEditError("مشکلی پیش اومد — دوباره تلاش کن");
          }
        }
      } catch {
        setEditError("اتصال برقرار نشد — دوباره تلاش کن");
      }
    });
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditContent(entry.content);
    setEditError(null);
  }

  const remaining = MAX_CHARS - editContent.length;
  const isOverLimit = remaining < 0;
  const canSave = editContent.trim().length >= MIN_CHARS && !isOverLimit && !isPending;

  return (
    <div className="w-full max-w-lg animate-fade-up">
      {/* تاریخ */}
      <div className="text-center mb-10">
        <p className="text-xs text-fog mb-1 fa-num">{weekdayLabel}</p>
        <p className="text-sm text-stone fa-num">{todayLabel}</p>
      </div>

      {/* کارت اصلی */}
      <div className="glass-strong rounded-3xl p-6 shadow-paper space-y-5">
        {/* هدر کارت */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-stone">تعهد امروز</span>

          {editable ? (
            <span className="text-[10px] text-sage bg-sage/10 px-2.5 py-1 rounded-full fa-num">
              تا {timeLeft} ویرایش می‌شود
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] text-fog bg-bone/70 px-2.5 py-1 rounded-full">
              <LockGlyph /> قفل شد
            </span>
          )}
        </div>

        {/* محتوا یا فرم ویرایش */}
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
              disabled={isPending}
              autoFocus
              className="
                w-full resize-none bg-transparent
                text-ink text-sm leading-loose
                focus:outline-none
                disabled:opacity-50
              "
              dir="rtl"
            />
            <div className="flex items-center justify-between pt-2 border-t border-bone">
              {editError ? (
                <p className="text-xs text-ember">{editError}</p>
              ) : (
                <span />
              )}
              <span
                className={`text-xs fa-num tabular-nums ${
                  isOverLimit ? "text-ember" : remaining < 50 ? "text-gold" : "text-fog"
                }`}
              >
                {remaining.toLocaleString("fa-IR")}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-ink text-sm leading-loose whitespace-pre-wrap" dir="rtl">
              {entry.content}
            </p>
            {entry.wasEdited && (
              <p className="text-[10px] text-fog mt-2">ویرایش شده</p>
            )}
          </div>
        )}

        {/* اکشن‌ها */}
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={!canSave}
              className="
                flex-1 py-2.5 rounded-full
                bg-sage text-paper text-xs font-medium
                hover:bg-sage-deep
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            >
              {isPending ? "در حال ذخیره…" : "ذخیره"}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isPending}
              className="
                flex-1 py-2.5 rounded-full
                border border-bone text-stone text-xs
                hover:bg-bone/60
                disabled:opacity-40
                transition-colors duration-200
              "
            >
              لغو
            </button>
          </div>
        ) : editable ? (
          <button
            onClick={() => setIsEditing(true)}
            className="
              w-full py-2.5 rounded-full
              border border-bone text-stone text-xs
              hover:bg-bone/60
              transition-colors duration-200
            "
          >
            ویرایش
          </button>
        ) : (
          <p className="flex items-center justify-center gap-1.5 text-xs text-fog">
            <SproutGlyph /> فردا بازخورد می‌دهی
          </p>
        )}
      </div>
    </div>
  );
}

// ─── گلیف‌ها — جایگزینِ ایموجی، هم‌خانوادهٔ خطیِ ظریفِ همسو ─────────────────────
function LockGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SproutGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className="text-sage">
      <path d="M12 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13c0-3 2.2-5.2 5.5-5.2C17.5 11 15.3 13 12 13Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 14c0-3.4-2.4-5.8-6-5.8C6 11.6 8.4 14 12 14Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
