"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BlogCommentsManager — مدیریتِ کامنت‌ها (DECISION-065)
// فیلترِ وضعیت، تأیید/رد/حذف، پاسخِ رسمیِ «همسو». ایمیلِ کامنت‌گذار فقط اینجا دیده می‌شود.
// متنِ دکمه‌ها ثابت (DECISION-053).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { toFaDigits } from "@/lib/utils/digits";
import { formatJalaliFromISO } from "@/lib/utils/date";
import { COMMENT_STATUS_LABELS, COMMENT_STATUSES, type CommentStatus } from "@/lib/blog/constants";

export interface AdminCommentRow {
  id: string;
  authorName: string;
  authorEmail: string;
  body: string;
  status: string;
  isAdminReply: boolean;
  parentId: string | null;
  createdAt: string;
  postTitle: string;
  postSlug: string;
  parentAuthor: string | null;
  parentExcerpt: string | null;
}

type Filter = "pending" | CommentStatus | "all";

export function BlogCommentsManager({
  initialComments,
  initialCounts,
}: {
  initialComments: AdminCommentRow[];
  initialCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pending");
  const [comments, setComments] = useState<AdminCommentRow[]>(initialComments);
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [loading, setLoading] = useState(false);
  const [replyId, setReplyId] = useState<string | null>(null);

  const load = useCallback(async (f: Filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/comments?status=${f}`, { cache: "no-store" });
      const d = await res.json();
      if (d?.ok) {
        setComments(d.comments);
        setCounts(d.counts ?? {});
      }
    } catch {
      toast.error("بارگیری انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, []);

  function selectFilter(f: Filter) {
    setFilter(f);
    setReplyId(null);
    void load(f);
  }

  async function moderate(id: string, action: "approve" | "reject") {
    try {
      const res = await fetch(`/api/admin/blog/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      if (res.ok && d?.ok) {
        toast.success(action === "approve" ? "تأیید شد." : "رد شد.");
        await load(filter);
        router.refresh();
      } else toast.error(d?.error ?? "انجام نشد.");
    } catch { toast.error("ارتباط برقرار نشد."); }
  }

  async function remove(id: string) {
    if (!confirm("این کامنت برای همیشه حذف شود؟")) return;
    try {
      const res = await fetch(`/api/admin/blog/comments/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (res.ok && d?.ok) {
        toast.success("حذف شد.");
        await load(filter);
        router.refresh();
      } else toast.error(d?.error ?? "حذف نشد.");
    } catch { toast.error("ارتباط برقرار نشد."); }
  }

  const filters: { key: Filter; label: string; count?: number }[] = [
    { key: "pending", label: COMMENT_STATUS_LABELS.pending, count: counts.pending ?? 0 },
    { key: "approved", label: COMMENT_STATUS_LABELS.approved, count: counts.approved ?? 0 },
    { key: "rejected", label: COMMENT_STATUS_LABELS.rejected, count: counts.rejected ?? 0 },
    { key: "all", label: "همه" },
  ];

  return (
    <section>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => selectFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              filter === f.key ? "bg-ink text-paper" : "bg-black/4 text-stone hover:bg-black/8"
            }`}
          >
            {f.label}
            {typeof f.count === "number" && (
              <span className="fa-num mr-1" style={{ opacity: 0.6 }}>{toFaDigits(f.count)}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-fog"><Spinner size={18} /></div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-fog bg-black/3 rounded-xl px-4 py-8 text-center">کامنتی در این وضعیت نیست.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-2xl border border-black/8 bg-white/40 p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm"
                  style={c.isAdminReply
                    ? { background: "var(--color-sage)", color: "var(--color-paper)", fontWeight: 600 }
                    : { background: "rgba(var(--rgb-line),0.06)", color: "var(--color-stone)", fontWeight: 500 }}
                >
                  {c.isAdminReply ? "ه" : c.authorName.slice(0, 1)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-medium text-ink">{c.isAdminReply ? "همسو" : c.authorName}</span>
                    {!c.isAdminReply && c.authorEmail && (
                      <span className="text-[11px] text-fog" dir="ltr">{c.authorEmail}</span>
                    )}
                    <StatusBadge status={c.status} />
                    {c.parentId && (
                      <span className="text-[10px] text-fog">↳ پاسخ به {c.parentAuthor}</span>
                    )}
                    <span className="text-[11px] text-fog fa-num mr-auto">{formatJalaliFromISO(c.createdAt)}</span>
                  </div>

                  <p className="text-sm text-stone" style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{c.body}</p>

                  <div className="mt-2 text-[11px] text-fog">
                    روی مقالهٔ:{" "}
                    <a href={`/blog/${c.postSlug}`} target="_blank" rel="noopener noreferrer" className="text-sage-deep hover:underline">
                      {c.postTitle}
                    </a>
                  </div>

                  {/* اکشن‌ها */}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {c.status !== "approved" && (
                      <button onClick={() => moderate(c.id, "approve")} className="text-xs px-3 py-1.5 rounded-lg bg-sage/12 text-sage-deep hover:bg-sage/20 transition-colors">تأیید</button>
                    )}
                    {c.status !== "rejected" && (
                      <button onClick={() => moderate(c.id, "reject")} className="text-xs px-3 py-1.5 rounded-lg text-stone hover:bg-black/5 transition-colors">رد</button>
                    )}
                    {!c.isAdminReply && (
                      <button onClick={() => setReplyId(replyId === c.id ? null : c.id)} className="text-xs px-3 py-1.5 rounded-lg text-sage-deep hover:bg-sage/8 transition-colors">
                        {replyId === c.id ? "بستن" : "پاسخ"}
                      </button>
                    )}
                    <button onClick={() => remove(c.id)} className="text-xs px-3 py-1.5 rounded-lg text-ember hover:bg-ember/8 transition-colors">حذف</button>
                  </div>

                  {replyId === c.id && (
                    <AdminReplyForm
                      commentId={c.id}
                      onDone={async () => { setReplyId(null); await load(filter); router.refresh(); }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style: Record<string, { bg: string; fg: string }> = {
    approved: { bg: "rgba(122,132,113,0.14)", fg: "#5C6555" },
    pending: { bg: "rgba(193,154,74,0.14)", fg: "#9A7B2E" },
    rejected: { bg: "rgba(199,93,60,0.12)", fg: "#C75D3C" },
  };
  const s = style[status] ?? style.pending;
  return (
    <span className="text-[10px] rounded-full px-2 py-0.5" style={{ background: s.bg, color: s.fg, fontWeight: 600 }}>
      {COMMENT_STATUS_LABELS[status as CommentStatus] ?? status}
    </span>
  );
}

function AdminReplyForm({ commentId, onDone }: { commentId: string; onDone: () => void }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    if (!body.trim()) { toast.error("متنِ پاسخ لازم است."); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/blog/comments/${commentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const d = await res.json();
      if (res.ok && d?.ok) { toast.success("پاسخ ثبت و منتشر شد."); onDone(); }
      else toast.error(d?.error ?? "ثبت نشد.");
    } catch { toast.error("ارتباط برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <div className="mt-3 rounded-xl border border-sage/25 bg-sage/5 p-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="پاسخِ رسمیِ همسو…"
        className="w-full bg-white/60 border border-black/10 rounded-lg px-3 py-2 text-sm text-ink outline-none resize-y"
      />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={submit} disabled={busy} className="btn btn-primary" style={{ fontSize: "13px", padding: "0.45rem 1rem" }}>
          {busy && <Spinner size={13} />}
          ثبتِ پاسخ
        </button>
        <span className="text-[11px] text-fog">پاسخ بلافاصله تأیید و منتشر می‌شود.</span>
      </div>
    </div>
  );
}
