"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BlogPostsManager — فهرستِ مقالات در پنل (DECISION-065)
// فیلترِ وضعیت، toggleِ سریعِ انتشار/شاخص، ویرایش، حذف. متنِ دکمه‌ها ثابت (DECISION-053).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { toFaDigits } from "@/lib/utils/digits";
import { formatJalaliFromISO } from "@/lib/utils/date";
import { POST_STATUS_LABELS, POST_STATUSES, type PostStatus } from "@/lib/blog/constants";

export interface PostRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  isFeatured: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readingMinutes: number;
  categoryName: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  published: { bg: "rgba(122,132,113,0.14)", fg: "#5C6555" },
  draft: { bg: "rgba(193,154,74,0.14)", fg: "#9A7B2E" },
  archived: { bg: "rgba(var(--rgb-line),0.07)", fg: "#6B6657" },
};

export function BlogPostsManager({ posts, canWrite }: { posts: PostRow[]; canWrite: boolean }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | PostStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const shown = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  async function setFlags(id: string, body: Record<string, unknown>, okMsg: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/blog/posts/${id}/flags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (res.ok && d?.ok) {
        toast.success(okMsg);
        router.refresh();
      } else {
        toast.error(d?.error ?? "انجام نشد.");
      }
    } catch {
      toast.error("ارتباط برقرار نشد.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p: PostRow) {
    if (!confirm(`«${p.title}» حذف شود؟ این عمل بازگشت‌ناپذیر است.`)) return;
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/admin/blog/posts/${p.id}`, { method: "DELETE" });
      const d = await res.json();
      if (res.ok && d?.ok) {
        toast.success("مقاله حذف شد.");
        router.refresh();
      } else {
        toast.error(d?.error ?? "حذف نشد.");
      }
    } catch {
      toast.error("ارتباط برقرار نشد.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      {/* فیلتر وضعیت */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterChip label="همه" active={filter === "all"} onClick={() => setFilter("all")} count={posts.length} />
        {POST_STATUSES.map((s) => (
          <FilterChip
            key={s}
            label={POST_STATUS_LABELS[s]}
            active={filter === s}
            onClick={() => setFilter(s)}
            count={posts.filter((p) => p.status === s).length}
          />
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-fog bg-black/3 rounded-xl px-4 py-8 text-center">
          {posts.length === 0 ? "هنوز مقاله‌ای نساخته‌ای." : "موردی در این وضعیت نیست."}
        </p>
      ) : (
        <div className="space-y-2">
          {shown.map((p) => {
            const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.archived;
            const busy = busyId === p.id;
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-black/8 bg-white/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                style={{ opacity: busy ? 0.6 : 1 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.isFeatured && (
                      <span title="شاخص" style={{ color: "var(--color-gold)" }}>★</span>
                    )}
                    <span className="font-medium text-ink truncate">{p.title}</span>
                    <span
                      className="text-[10px] rounded-full px-2 py-0.5 shrink-0"
                      style={{ background: st.bg, color: st.fg, fontWeight: 600 }}
                    >
                      {POST_STATUS_LABELS[p.status as PostStatus] ?? p.status}
                    </span>
                    {p.categoryName && (
                      <span className="text-[10px] text-fog">· {p.categoryName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-fog fa-num flex-wrap">
                    <span>{toFaDigits(p.viewCount)} بازدید</span>
                    <span>{toFaDigits(p.likeCount)} لایک</span>
                    <span>{toFaDigits(p.commentCount)} کامنت</span>
                    <span>{toFaDigits(p.readingMinutes)} دقیقه</span>
                    {p.publishedAt && <span>· {formatJalaliFromISO(p.publishedAt)}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <a
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2.5 py-1.5 rounded-lg text-stone hover:bg-black/5 transition-colors"
                    title="مشاهده در سایت"
                  >
                    نمایش
                  </a>
                  {canWrite && (
                    <>
                      <Link
                        href={`/admin/blog/posts/${p.id}`}
                        className="text-xs px-2.5 py-1.5 rounded-lg text-sage-deep hover:bg-sage/8 transition-colors"
                      >
                        ویرایش
                      </Link>
                      <button
                        disabled={busy}
                        onClick={() => setFlags(p.id, { isFeatured: !p.isFeatured }, p.isFeatured ? "از شاخص خارج شد." : "شاخص شد.")}
                        className="text-xs px-2.5 py-1.5 rounded-lg text-stone hover:bg-black/5 transition-colors"
                      >
                        {p.isFeatured ? "حذف شاخص" : "شاخص"}
                      </button>
                      {p.status === "published" ? (
                        <button
                          disabled={busy}
                          onClick={() => setFlags(p.id, { status: "draft" }, "به پیش‌نویس رفت.")}
                          className="text-xs px-2.5 py-1.5 rounded-lg text-stone hover:bg-black/5 transition-colors"
                        >
                          پیش‌نویس
                        </button>
                      ) : (
                        <button
                          disabled={busy}
                          onClick={() => setFlags(p.id, { status: "published" }, "منتشر شد.")}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-sage/12 text-sage-deep hover:bg-sage/20 transition-colors"
                        >
                          انتشار
                        </button>
                      )}
                      <button
                        disabled={busy}
                        onClick={() => remove(p)}
                        className="text-xs px-2.5 py-1.5 rounded-lg text-ember hover:bg-ember/8 transition-colors"
                      >
                        حذف
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FilterChip({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
        active ? "bg-ink text-paper" : "bg-black/4 text-stone hover:bg-black/8"
      }`}
    >
      {label}
      <span className="fa-num mr-1" style={{ opacity: 0.6 }}>{toFaDigits(count)}</span>
    </button>
  );
}
