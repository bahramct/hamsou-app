"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DayDetailModal — جزئیاتِ یک روز: همهٔ استوری‌ها (ویرایش/حذف) + بینشِ همراهِ آن روز.
// readOnly برای صفحهٔ تاریخچه. متنِ دکمه‌ها ثابت + Spinner + toast (DECISION-053).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/lib/notifications/toast";
import { MOOD_LABELS } from "@/lib/goal/storyboard";
import type { DaySlot } from "@/lib/goal/storyboard";
import type { SerializedStory } from "@/types/goal";

const MAX = 4000;

export function DayDetailModal({
  slot,
  readOnly = false,
  onClose,
}: {
  slot: DaySlot;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  return (
    <>
      <div
        aria-hidden
        onClick={close}
        className="fixed inset-0 z-50"
        style={{
          background: "rgba(26,26,31,0.22)",
          backdropFilter: visible ? "blur(6px)" : "none",
          opacity: visible ? 1 : 0,
          transition: "opacity 220ms ease, backdrop-filter 220ms ease",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-5"
        role="dialog"
        aria-modal="true"
        aria-label={`روز ${slot.dayNumber}`}
      >
        <div
          className="pointer-events-auto w-full max-w-md overflow-hidden rounded-3xl border border-black/8 shadow-[0_20px_60px_rgba(26,26,31,0.18),0_0_0_1px_rgba(255,255,255,0.5)_inset]"
          style={{
            background: "rgba(var(--rgb-paper),0.94)",
            backdropFilter: "blur(24px) saturate(140%)",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.94)",
            transition: "opacity 220ms ease, transform 280ms cubic-bezier(0.19,1,0.22,1)",
          }}
        >
          <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink fa-num">
                روز {slot.dayNumber.toLocaleString("fa-IR")}
              </h2>
              <p className="text-[11px] text-fog fa-num">
                {slot.weekdayLabel} · {slot.dayLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="بستن"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/6 transition-colors hover:bg-black/10"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:hidden">
            {slot.stories.length === 0 && (
              <p className="px-2 py-6 text-center text-[13px] text-fog">برای این روز چیزی ثبت نشده.</p>
            )}

            {slot.stories.map((s) => (
              <StoryRow key={s.id} story={s} readOnly={readOnly} />
            ))}

            {slot.insight && (
              <div className="rounded-2xl border border-sage/20 bg-sage/5 p-3.5">
                <p className="mb-1.5 text-[11px] font-medium text-sage-deep">راهنماییِ همراه</p>
                <p className="text-[13px] leading-relaxed text-ink">{slot.insight.reflection}</p>
                {slot.insight.suggestions.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {slot.insight.suggestions.map((sg, i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-stone">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sage" />
                        <span>{sg}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StoryRow({ story, readOnly }: { story: SerializedStory; readOnly: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(story.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save() {
    const content = draft.trim();
    if (!content || content.length > MAX || isPending) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/goal/story/${story.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
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

  function remove() {
    if (isPending) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/goal/story/${story.id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          toast.success("استوری حذف شد");
          router.refresh();
        } else {
          toast.error(data.message ?? "مشکلی پیش آمد");
        }
      } catch {
        toast.error("اتصال برقرار نشد");
      }
    });
  }

  if (editing) {
    return (
      <div className="rounded-2xl bg-black/3 p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          dir="rtl"
          disabled={isPending}
          className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-ink focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(story.content);
              setEditing(false);
            }}
            className="rounded-full px-3 py-1.5 text-[12px] text-stone hover:bg-black/5"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isPending || !draft.trim()}
            className="flex items-center gap-1.5 rounded-full bg-sage px-4 py-1.5 text-[12px] font-medium text-paper transition-colors hover:bg-sage-deep disabled:opacity-40"
          >
            {isPending && <Spinner size={12} />}
            ذخیره
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-black/3 p-3.5">
      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{story.content}</p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px] text-fog">
          {story.mood ? MOOD_LABELS[story.mood] : ""}
        </span>
        {!readOnly && (
          <div className="flex items-center gap-1">
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={remove}
                  disabled={isPending}
                  className="rounded-full px-2.5 py-1 text-[11px] text-ember hover:bg-ember/8 disabled:opacity-40"
                >
                  حذف شود؟
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-full px-2 py-1 text-[11px] text-fog hover:bg-black/5"
                >
                  نه
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-full px-2.5 py-1 text-[11px] text-stone hover:bg-black/5"
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-full px-2.5 py-1 text-[11px] text-fog hover:bg-ember/8 hover:text-ember"
                >
                  حذف
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
