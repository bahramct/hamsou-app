"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CommentsSection — گفت‌وگوی مقاله (ری‌دیزاین کارتی)
// • فقط کاربرانِ عضو (لاگین‌کرده) می‌توانند کامنت/پاسخ بگذارند (DECISION-079).
//   اگر کاربر عضو نباشد، به‌جای فرم یک کارتِ دعوت به عضویت + لینکِ ورود دیده می‌شود.
// • ترتیب: جدیدترین → قدیمی‌ترین (سرور مرتب می‌کند). بیش از ۱۰ کامنتِ ریشه →
//   صفحه‌بندیِ سمتِ کلاینت (بدونِ رفرشِ صفحه).
// • کامنتِ خودِ کاربر تا تأیید ادمین به‌صورت gray-out فقط برای خودش دیده می‌شود
//   (ذخیره در localStorage همین دستگاه؛ پس از تأیید، خودکار عادی می‌شود).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatJalali } from "@/lib/utils/date";
import { toFaDigits } from "@/lib/utils/digits";
import { CommentForm, type SubmittedComment } from "./CommentForm";

export interface CommentNode {
  id: string;
  authorName: string;
  body: string;
  isAdminReply: boolean;
  createdAtIso: string;
  replies: CommentNode[];
}

/** کاربرِ عضوِ لاگین‌کرده — فقط نامِ نمایشی. null = مهمان. */
export interface CurrentUser {
  name: string;
}

/** کامنتِ در انتظارِ تأییدِ همین بازدیدکننده (فقط روی همین دستگاه دیده می‌شود). */
interface PendingComment {
  id: string;
  authorName: string;
  body: string;
  parentId: string | null;
  createdAtIso: string;
}

const ROOTS_PER_PAGE = 10; // بیش از ۱۰ کامنتِ ریشه → صفحهٔ بعد
const PENDING_TTL_MS = 7 * 24 * 60 * 60 * 1000; // ۷ روز
const pendingKey = (slug: string) => `hamsoo:blog:pending-comments:${slug}`;

function loadPending(slug: string, approvedIds: Set<string>): PendingComment[] {
  try {
    const raw = localStorage.getItem(pendingKey(slug));
    if (!raw) return [];
    const arr = JSON.parse(raw) as PendingComment[];
    const now = Date.now();
    const alive = arr.filter(
      (p) =>
        p?.id &&
        !approvedIds.has(p.id) && // تأیید شد → دیگر «در انتظار» نیست
        now - new Date(p.createdAtIso).getTime() < PENDING_TTL_MS
    );
    if (alive.length !== arr.length) {
      localStorage.setItem(pendingKey(slug), JSON.stringify(alive));
    }
    return alive;
  } catch {
    return [];
  }
}

function savePending(slug: string, items: PendingComment[]) {
  try {
    localStorage.setItem(pendingKey(slug), JSON.stringify(items));
  } catch {
    // localStorage بسته — gray-out فقط تا رفرش بعدی می‌ماند
  }
}

function collectIds(nodes: CommentNode[], into: Set<string>) {
  for (const n of nodes) {
    into.add(n.id);
    collectIds(n.replies, into);
  }
}

export function CommentsSection({
  slug,
  comments,
  totalCount,
  currentUser,
}: {
  slug: string;
  comments: CommentNode[];
  totalCount: number;
  currentUser: CurrentUser | null;
}) {
  const approvedIds = useMemo(() => {
    const s = new Set<string>();
    collectIds(comments, s);
    return s;
  }, [comments]);

  const [pending, setPending] = useState<PendingComment[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPending(loadPending(slug, approvedIds));
  }, [slug, approvedIds]);

  function addPending(c: SubmittedComment) {
    const item: PendingComment = {
      id: c.id,
      authorName: c.authorName,
      body: c.body,
      parentId: c.parentId,
      createdAtIso: c.createdAtIso,
    };
    setPending((prev) => {
      const next = [...prev, item];
      savePending(slug, next);
      return next;
    });
  }

  const pendingRoots = pending.filter((p) => !p.parentId);
  const pendingByParent = useMemo(() => {
    const m = new Map<string, PendingComment[]>();
    for (const p of pending) {
      if (!p.parentId) continue;
      const arr = m.get(p.parentId) ?? [];
      arr.push(p);
      m.set(p.parentId, arr);
    }
    return m;
  }, [pending]);

  // صفحه‌بندیِ کامنت‌های تأییدشده (سرور: جدیدترین→قدیمی‌ترین).
  const pageCount = Math.max(1, Math.ceil(comments.length / ROOTS_PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const pageComments = comments.slice(
    (safePage - 1) * ROOTS_PER_PAGE,
    safePage * ROOTS_PER_PAGE
  );

  function goToPage(p: number) {
    setPage(p);
    // پرشِ نرم به بالای بخشِ گفت‌وگو (بدونِ رفرش)
    document.getElementById("comments")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="comments" className="max-w-2xl py-14 text-right">
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

      {/* فرمِ کامنتِ جدید — فقط برای کاربرِ عضو؛ مهمان → دعوت به عضویت */}
      {currentUser ? (
        <div
          className="rounded-2xl p-5 mb-10"
          style={{ background: "rgba(var(--rgb-card),0.45)", border: "1px solid rgba(var(--rgb-line),0.07)" }}
        >
          <p className="text-stone mb-4" style={{ fontWeight: 300, fontSize: "14px", lineHeight: 1.7 }}>
            نظرت را بنویس. کامنت‌ها پس از مرورِ ما برای همه نمایش داده می‌شوند.
          </p>
          <CommentForm slug={slug} authorName={currentUser.name} onSubmitted={addPending} />
        </div>
      ) : (
        <RegisterGate slug={slug} />
      )}

      {/* فهرستِ کامنت‌ها */}
      {comments.length === 0 && pendingRoots.length === 0 ? (
        <p className="text-fog text-center py-6" style={{ fontWeight: 300, fontSize: "15px" }}>
          هنوز کامنتی نیست. اولین نفر باش.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {/* کامنت‌های در انتظارِ خودِ کاربر — بالای صفحهٔ اول (جدیدترین) */}
            {safePage === 1 &&
              pendingRoots.map((p) => <PendingCard key={p.id} item={p} />)}
            {pageComments.map((c) => (
              <CommentCard
                key={c.id}
                slug={slug}
                comment={c}
                currentUser={currentUser}
                pendingReplies={pendingByParent.get(c.id) ?? []}
                onSubmitted={addPending}
              />
            ))}
          </div>

          {pageCount > 1 && (
            <Pagination page={safePage} pageCount={pageCount} onChange={goToPage} />
          )}
        </>
      )}
    </section>
  );
}

// ─── کارتِ دعوت به عضویت (مهمان) ────────────────────────────────────────────
// returnUrl = /blog/slug#comments تا پس از لاگین مستقیم به همین بخش برگردد
function RegisterGate({ slug }: { slug: string }) {
  const returnUrl = encodeURIComponent(`/blog/${slug}#comments`);
  return (
    <div
      className="rounded-2xl p-6 mb-10 text-center"
      style={{ background: "rgba(var(--rgb-card),0.45)", border: "1px solid rgba(var(--rgb-line),0.08)" }}
    >
      <p className="text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.9 }}>
        برای ثبت نظر باید عضو همسو شوی.
      </p>
      <Link
        href={`/login?returnUrl=${returnUrl}`}
        className="btn btn-primary mt-4 inline-flex"
        style={{ fontSize: "14px", padding: "0.6rem 1.6rem" }}
      >
        ورود یا ثبت‌نام
      </Link>
    </div>
  );
}

// ─── نوارِ صفحه‌بندی (بدونِ رفرش) ────────────────────────────────────────────
function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const navStyle = (active: boolean): React.CSSProperties =>
    active
      ? { background: "var(--color-ink)", color: "var(--color-paper)", fontWeight: 500 }
      : { background: "rgba(var(--rgb-line),0.05)", color: "var(--color-stone)", fontWeight: 400 };

  return (
    <div className="mt-8 flex items-center justify-center gap-1.5 flex-wrap" dir="ltr">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="text-xs rounded-lg px-3 py-1.5 transition-all disabled:opacity-35"
        style={navStyle(false)}
      >
        قبلی
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="fa-num text-xs rounded-lg w-8 h-8 transition-all"
          style={navStyle(p === page)}
        >
          {toFaDigits(p)}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        className="text-xs rounded-lg px-3 py-1.5 transition-all disabled:opacity-35"
        style={navStyle(false)}
      >
        بعدی
      </button>
    </div>
  );
}

// ─── آواتار حرف اول ───────────────────────────────────────────────────────────
function Avatar({ name, isAdmin, dim = 38 }: { name: string; isAdmin: boolean; dim?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 text-sm"
      style={
        isAdmin
          ? { width: dim, height: dim, background: "var(--color-sage)", color: "var(--color-paper)", fontWeight: 600 }
          : { width: dim, height: dim, background: "rgba(var(--rgb-line),0.06)", color: "var(--color-stone)", fontWeight: 500 }
      }
    >
      {isAdmin ? "ه" : name.slice(0, 1)}
    </div>
  );
}

function CommentHeader({ name, isAdmin, dateIso }: { name: string; isAdmin: boolean; dateIso: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap min-w-0">
      <span style={{ fontWeight: 500, fontSize: "14px", color: "var(--color-ink)" }}>
        {isAdmin ? "همسو" : name}
      </span>
      {isAdmin && (
        <span
          className="text-[10px] rounded-full px-1.5 py-0.5"
          style={{ background: "rgba(122,132,113,0.14)", color: "var(--color-sage-deep)", fontWeight: 500 }}
        >
          تیمِ همسو
        </span>
      )}
      <span className="text-fog text-xs fa-num" style={{ fontWeight: 300 }}>
        {formatJalali(new Date(dateIso))}
      </span>
    </div>
  );
}

// ─── کارتِ کامنتِ منتشرشده (+ پاسخ‌های تو در تو) ─────────────────────────────
function CommentCard({
  slug,
  comment,
  currentUser,
  pendingReplies,
  onSubmitted,
}: {
  slug: string;
  comment: CommentNode;
  currentUser: CurrentUser | null;
  pendingReplies: PendingComment[];
  onSubmitted: (c: SubmittedComment) => void;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <article
      className="rounded-2xl p-5"
      style={{
        background: "rgba(var(--rgb-card),0.55)",
        border: "1px solid rgba(var(--rgb-line),0.08)",
        boxShadow: "0 3px 16px rgba(46,44,40,0.04)",
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar name={comment.authorName} isAdmin={comment.isAdminReply} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <CommentHeader name={comment.authorName} isAdmin={comment.isAdminReply} dateIso={comment.createdAtIso} />
            {/* پاسخ فقط برای کاربرِ عضو */}
            {currentUser && (
              <button
                onClick={() => setReplying((v) => !v)}
                className="shrink-0 text-xs rounded-full px-3 py-1 transition-all"
                style={
                  replying
                    ? { color: "var(--color-ember)", background: "rgba(199,93,60,0.07)", fontWeight: 400 }
                    : { color: "var(--color-sage-deep)", background: "rgba(122,132,113,0.08)", fontWeight: 400 }
                }
              >
                {replying ? "بستن" : "پاسخ"}
              </button>
            )}
          </div>

          <p className="mt-2 text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
            {comment.body}
          </p>

          {replying && currentUser && (
            <div className="mt-4">
              <CommentForm
                slug={slug}
                authorName={currentUser.name}
                parentId={comment.id}
                compact
                onSubmitted={onSubmitted}
                onDone={() => setReplying(false)}
                onCancel={() => setReplying(false)}
              />
            </div>
          )}

          {/* پاسخ‌ها — داخل همان کارت، با خطِ راهنما */}
          {(comment.replies.length > 0 || pendingReplies.length > 0) && (
            <div
              className="mt-5 space-y-4 pr-4"
              style={{ borderRight: "2px solid rgba(122,132,113,0.16)" }}
            >
              {comment.replies.map((r) => (
                <div key={r.id} className="flex items-start gap-2.5">
                  <Avatar name={r.authorName} isAdmin={r.isAdminReply} dim={30} />
                  <div className="flex-1 min-w-0">
                    <CommentHeader name={r.authorName} isAdmin={r.isAdminReply} dateIso={r.createdAtIso} />
                    <p className="mt-1.5 text-stone" style={{ fontWeight: 300, fontSize: "14px", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
                      {r.body}
                    </p>
                  </div>
                </div>
              ))}
              {pendingReplies.map((p) => (
                <PendingReply key={p.id} item={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── کامنت/پاسخِ در انتظارِ تأیید — gray-out، فقط برای نویسنده‌اش ─────────────
function PendingBadge() {
  return (
    <span
      className="text-[10px] rounded-full px-2 py-0.5 shrink-0"
      style={{ background: "rgba(var(--rgb-line),0.07)", color: "var(--color-fog)", fontWeight: 500 }}
    >
      در انتظار تأیید — فقط تو می‌بینی
    </span>
  );
}

function PendingCard({ item }: { item: PendingComment }) {
  return (
    <article
      className="rounded-2xl p-5"
      style={{
        background: "rgba(var(--rgb-line),0.025)",
        border: "1px dashed rgba(var(--rgb-line),0.18)",
        opacity: 0.62,
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar name={item.authorName} isAdmin={false} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CommentHeader name={item.authorName} isAdmin={false} dateIso={item.createdAtIso} />
            <PendingBadge />
          </div>
          <p className="mt-2 text-stone" style={{ fontWeight: 300, fontSize: "15px", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
            {item.body}
          </p>
        </div>
      </div>
    </article>
  );
}

function PendingReply({ item }: { item: PendingComment }) {
  return (
    <div className="flex items-start gap-2.5" style={{ opacity: 0.62 }}>
      <Avatar name={item.authorName} isAdmin={false} dim={30} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CommentHeader name={item.authorName} isAdmin={false} dateIso={item.createdAtIso} />
          <PendingBadge />
        </div>
        <p className="mt-1.5 text-stone" style={{ fontWeight: 300, fontSize: "14px", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
          {item.body}
        </p>
      </div>
    </div>
  );
}
