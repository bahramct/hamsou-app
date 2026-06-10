"use client";

import { useState } from "react";
import { formatJalali } from "@/lib/utils/date";
import { toFaDigits } from "@/lib/utils/digits";
import { CommentForm } from "./CommentForm";

export interface CommentNode {
  id: string;
  authorName: string;
  body: string;
  isAdminReply: boolean;
  createdAtIso: string;
  replies: CommentNode[];
}

// بخشِ کامنت‌ها — فهرستِ کامنت‌های تأییدشده + فرمِ ریشه + پاسخِ تودرتوی یک‌سطح.
export function CommentsSection({
  slug,
  comments,
  totalCount,
}: {
  slug: string;
  comments: CommentNode[];
  totalCount: number;
}) {
  return (
    <section id="comments" className="relative z-10 max-w-2xl mx-auto px-6 lg:px-0 py-14">
      <div className="flex items-center gap-3 mb-8">
        <h2 style={{ fontWeight: 300, fontSize: "26px", letterSpacing: "-0.02em", color: "var(--color-ink)" }}>
          گفت‌وگو
        </h2>
        {totalCount > 0 && (
          <span
            className="fa-num text-xs rounded-full px-2.5 py-1"
            style={{ background: "rgba(122,132,113,0.10)", color: "var(--color-sage-deep)", fontWeight: 500 }}
          >
            {toFaDigits(totalCount)}
          </span>
        )}
      </div>

      {/* فرمِ کامنتِ جدید */}
      <div
        className="rounded-2xl p-5 mb-10"
        style={{ background: "rgba(var(--rgb-card),0.45)", border: "1px solid rgba(var(--rgb-line),0.07)" }}
      >
        <p className="text-stone mb-4" style={{ fontWeight: 300, fontSize: "14px", lineHeight: 1.7 }}>
          نظرت را بنویس. کامنت‌ها پس از مرورِ ما نمایش داده می‌شوند — ایمیلت خصوصی می‌ماند.
        </p>
        <CommentForm slug={slug} />
      </div>

      {/* فهرستِ کامنت‌ها */}
      {comments.length === 0 ? (
        <p className="text-fog text-center py-6" style={{ fontWeight: 300, fontSize: "15px" }}>
          هنوز کامنتی نیست. اولین نفر باش.
        </p>
      ) : (
        <div className="space-y-8">
          {comments.map((c) => (
            <CommentItem key={c.id} slug={slug} comment={c} />
          ))}
        </div>
      )}
    </section>
  );
}

function CommentItem({ slug, comment, isReply = false }: { slug: string; comment: CommentNode; isReply?: boolean }) {
  const [replying, setReplying] = useState(false);

  return (
    <div className={isReply ? "pr-5 mr-2" : ""} style={isReply ? { borderRight: "2px solid rgba(122,132,113,0.18)" } : {}}>
      <div className="flex items-start gap-3">
        {/* آواتارِ حرفِ اول */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm"
          style={
            comment.isAdminReply
              ? { background: "var(--color-sage)", color: "var(--color-paper)", fontWeight: 600 }
              : { background: "rgba(var(--rgb-line),0.06)", color: "var(--color-stone)", fontWeight: 500 }
          }
        >
          {comment.isAdminReply ? "ه" : comment.authorName.slice(0, 1)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span style={{ fontWeight: 500, fontSize: "14px", color: "var(--color-ink)" }}>
              {comment.isAdminReply ? "همسو" : comment.authorName}
            </span>
            {comment.isAdminReply && (
              <span
                className="text-[10px] rounded-full px-1.5 py-0.5"
                style={{ background: "rgba(122,132,113,0.14)", color: "var(--color-sage-deep)", fontWeight: 500 }}
              >
                تیمِ همسو
              </span>
            )}
            <span className="text-fog text-xs fa-num" style={{ fontWeight: 300 }}>
              {formatJalali(new Date(comment.createdAtIso))}
            </span>
          </div>

          <p className="text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
            {comment.body}
          </p>

          {/* پاسخ فقط روی کامنت‌های ریشه */}
          {!isReply && (
            <button
              onClick={() => setReplying((v) => !v)}
              className="mt-2 text-xs transition-colors"
              style={{ color: replying ? "var(--color-ember)" : "var(--color-sage-deep)", fontWeight: 400 }}
            >
              {replying ? "بستن" : "پاسخ"}
            </button>
          )}

          {replying && (
            <div className="mt-3">
              <CommentForm
                slug={slug}
                parentId={comment.id}
                compact
                onDone={() => setReplying(false)}
                onCancel={() => setReplying(false)}
              />
            </div>
          )}

          {/* پاسخ‌ها */}
          {comment.replies.length > 0 && (
            <div className="mt-5 space-y-5">
              {comment.replies.map((r) => (
                <CommentItem key={r.id} slug={slug} comment={r} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
