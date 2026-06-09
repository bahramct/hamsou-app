"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BlogTaxonomyManager — مدیریتِ دسته‌ها و برچسب‌ها (DECISION-065)
// دسته: CRUD کامل. برچسب: فهرست + حذف (ساختِ خودکار هنگامِ نوشتنِ مقاله).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { toFaDigits } from "@/lib/utils/digits";

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
  isActive: boolean;
  postCount: number;
}

export interface TagRow {
  id: string;
  slug: string;
  name: string;
  postCount: number;
}

export function BlogTaxonomyManager({
  categories,
  tags,
  canWrite,
}: {
  categories: CategoryRow[];
  tags: TagRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* دسته‌ها */}
      <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">دسته‌ها</h2>
          {canWrite && !adding && editingId === null && (
            <button
              onClick={() => setAdding(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-ink text-paper hover:bg-charcoal transition-colors"
            >
              + دسته
            </button>
          )}
        </div>

        {adding && (
          <CategoryForm
            onCancel={() => setAdding(false)}
            onSaved={() => { setAdding(false); router.refresh(); }}
          />
        )}

        {categories.length === 0 && !adding ? (
          <p className="text-[12px] text-fog bg-black/3 rounded-lg px-3 py-2">هنوز دسته‌ای نساخته‌ای.</p>
        ) : (
          <div className="space-y-2 mt-2">
            {categories.map((c) =>
              editingId === c.id ? (
                <CategoryForm
                  key={c.id}
                  initial={c}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => { setEditingId(null); router.refresh(); }}
                />
              ) : (
                <div key={c.id} className="flex items-center gap-2 rounded-xl border border-black/6 bg-white/50 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink truncate">{c.name}</span>
                      {!c.isActive && <span className="text-[10px] text-fog">(غیرفعال)</span>}
                    </div>
                    <div className="text-[11px] text-fog fa-num">
                      {toFaDigits(c.postCount)} مقاله · {c.slug}
                    </div>
                  </div>
                  {canWrite && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditingId(c.id)} className="text-xs px-2 py-1 rounded-lg text-sage-deep hover:bg-sage/8">ویرایش</button>
                      <DeleteCategoryButton id={c.id} name={c.name} postCount={c.postCount} onDone={() => router.refresh()} />
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* برچسب‌ها */}
      <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
        <h2 className="text-sm font-semibold text-ink mb-1">برچسب‌ها</h2>
        <p className="text-xs text-fog mb-3">برچسب‌ها هنگامِ نوشتنِ مقاله خودکار ساخته می‌شوند. اینجا می‌توانی برچسبِ بی‌استفاده را حذف کنی.</p>
        {tags.length === 0 ? (
          <p className="text-[12px] text-fog bg-black/3 rounded-lg px-3 py-2">هنوز برچسبی نیست.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t.id} className="inline-flex items-center gap-1.5 text-xs bg-black/5 text-stone rounded-full px-2.5 py-1.5">
                #{t.name}
                <span className="text-fog fa-num">{toFaDigits(t.postCount)}</span>
                {canWrite && <DeleteTagButton id={t.id} name={t.name} onDone={() => router.refresh()} />}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: CategoryRow;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [order, setOrder] = useState(String(initial?.order ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    if (!name.trim()) { toast.error("نامِ دسته لازم است."); return; }
    setBusy(true);
    try {
      const url = initial ? `/api/admin/blog/categories/${initial.id}` : "/api/admin/blog/categories";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined, description, order: parseInt(order, 10) || 0, isActive }),
      });
      const d = await res.json();
      if (res.ok && d?.ok) {
        toast.success(initial ? "دسته ذخیره شد." : "دسته ساخته شد.");
        onSaved();
      } else {
        toast.error(d?.error ?? "ذخیره نشد.");
      }
    } catch {
      toast.error("ارتباط برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  const inp = "w-full bg-white/60 border border-black/10 rounded-lg px-3 py-2 text-sm text-ink outline-none";

  return (
    <div className="rounded-xl border border-sage/25 bg-sage/5 p-3 space-y-2.5 mb-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="نامِ دسته" className={inp} />
      <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="نشانی (اختیاری، خودکار)" dir="ltr" style={{ textAlign: "right" }} className={inp} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="توضیحِ کوتاه (اختیاری)" rows={2} className={`${inp} resize-y`} />
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-stone">
          <span>ترتیب</span>
          <input value={order} onChange={(e) => setOrder(e.target.value)} inputMode="numeric" className="w-16 bg-white/60 border border-black/10 rounded-lg px-2 py-1 text-sm text-ink outline-none fa-num" />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-stone cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          فعال
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={submit} disabled={busy} className="btn btn-primary" style={{ fontSize: "13px", padding: "0.45rem 1rem" }}>
          {busy && <Spinner size={13} />}
          {initial ? "ذخیره" : "افزودن"}
        </button>
        <button onClick={onCancel} className="btn btn-ghost" style={{ fontSize: "13px", padding: "0.45rem 0.9rem" }}>انصراف</button>
      </div>
    </div>
  );
}

function DeleteCategoryButton({ id, name, postCount, onDone }: { id: string; name: string; postCount: number; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  async function del() {
    const warn = postCount > 0
      ? `«${name}» حذف شود؟ ${postCount} مقالهٔ آن بدونِ دسته می‌شوند.`
      : `«${name}» حذف شود؟`;
    if (!confirm(warn)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/blog/categories/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (res.ok && d?.ok) { toast.success("دسته حذف شد."); onDone(); }
      else toast.error(d?.error ?? "حذف نشد.");
    } catch { toast.error("ارتباط برقرار نشد."); }
    finally { setBusy(false); }
  }
  return (
    <button onClick={del} disabled={busy} className="text-xs px-2 py-1 rounded-lg text-ember hover:bg-ember/8">حذف</button>
  );
}

function DeleteTagButton({ id, name, onDone }: { id: string; name: string; onDone: () => void }) {
  async function del() {
    if (!confirm(`برچسبِ «${name}» حذف شود؟`)) return;
    try {
      const res = await fetch(`/api/admin/blog/tags/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (res.ok && d?.ok) { toast.success("برچسب حذف شد."); onDone(); }
      else toast.error(d?.error ?? "حذف نشد.");
    } catch { toast.error("ارتباط برقرار نشد."); }
  }
  return <button onClick={del} className="text-fog hover:text-ember" title="حذف">✕</button>;
}
