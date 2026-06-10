"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BlogPostEditor — ساخت/ویرایشِ مقاله (DECISION-065 + DECISION-069)
// محتوا: ادیتورِ حرفه‌ایِ بصری (Tiptap) با خروجی Markdown — RichMarkdownEditor.
// کاور: فشرده‌سازیِ canvas → base64.
// متنِ دکمهٔ ذخیره ثابت می‌ماند؛ فقط Spinner + toast (DECISION-053).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { compressImage } from "@/lib/utils/compress-image";
import { RichMarkdownEditor } from "./RichMarkdownEditor";
import { POST_STATUSES, POST_STATUS_LABELS } from "@/lib/blog/constants";

export interface EditorCategory {
  id: string;
  name: string;
}

export interface EditorInitial {
  id: string;
  slug: string;
  shortCode: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  categoryId: string | null;
  authorName: string;
  status: string;
  isFeatured: boolean;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}

interface Props {
  mode: "create" | "edit";
  categories: EditorCategory[];
  initial?: EditorInitial;
}

const COVER_MAX_W = 1600;
const COVER_QUALITY = 0.82;

export function BlogPostEditor({ mode, categories, initial }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverImage, setCoverImage] = useState<string | null>(initial?.coverImage ?? null);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [authorName, setAuthorName] = useState(initial?.authorName ?? "تیم همسو");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const [showSeo, setShowSeo] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const t = raw.trim().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 12) setTags((prev) => [...prev, t]);
    setTagInput("");
  }
  function onTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  async function onCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایلِ تصویری مجاز است.");
      return;
    }
    try {
      const dataUrl = await compressImage(file, COVER_MAX_W, COVER_QUALITY);
      setCoverImage(dataUrl);
    } catch {
      toast.error("پردازشِ تصویر انجام نشد.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    if (busy) return;
    if (!title.trim()) {
      toast.error("عنوان لازم است.");
      return;
    }
    if (!content.trim()) {
      toast.error("متنِ مقاله لازم است.");
      return;
    }
    setBusy(true);
    const payload = {
      title,
      slug: slug || undefined,
      excerpt,
      content,
      coverImage,
      categoryId: categoryId || null,
      authorName,
      status,
      isFeatured,
      metaTitle,
      metaDescription,
      tags,
    };
    try {
      const url = mode === "create" ? "/api/admin/blog/posts" : `/api/admin/blog/posts/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (res.ok && d?.ok) {
        toast.success(mode === "create" ? "مقاله ساخته شد." : "تغییرات ذخیره شد.");
        if (mode === "create") {
          router.push(`/admin/blog/posts/${d.id}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(d?.error ?? "ذخیره نشد.");
      }
    } catch {
      toast.error("ارتباط برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* ستونِ اصلی */}
      <div className="lg:col-span-2 space-y-4">
        {/* عنوان */}
        <div className="rounded-2xl border border-black/8 bg-white/40 p-4">
          <Label>عنوان</Label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوانِ مقاله…"
            className="w-full bg-transparent outline-none text-lg font-medium text-ink"
            style={{ borderBottom: "1px solid rgba(var(--rgb-line),0.08)", padding: "0.4rem 0" }}
          />
        </div>

        {/* محتوا — ادیتورِ بصری (آنچه می‌بینی همان است که در سایت رندر می‌شود) */}
        <div className="rounded-2xl border border-black/8 bg-white/40 p-4">
          <div className="mb-2">
            <Label>متنِ مقاله</Label>
          </div>
          <RichMarkdownEditor value={content} onChange={setContent} />
          <p className="text-[11px] text-fog mt-2">
            در دیتابیس به‌صورت Markdown ذخیره می‌شود — با دکمهٔ «Markdown خام» می‌توانی مستقیم ویرایش کنی.
          </p>
        </div>

        {/* خلاصه */}
        <div className="rounded-2xl border border-black/8 bg-white/40 p-4">
          <Label>خلاصه <span className="text-fog font-normal">(اختیاری — اگر خالی باشد خودکار ساخته می‌شود)</span></Label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="خلاصهٔ کوتاه برای کارتِ فهرست و متا…"
            className="w-full bg-transparent outline-none text-sm text-stone resize-y mt-1"
          />
        </div>

        {/* SEO */}
        <div className="rounded-2xl border border-black/8 bg-white/40 p-4">
          <button
            type="button"
            onClick={() => setShowSeo((v) => !v)}
            className="flex items-center justify-between w-full text-sm font-medium text-ink"
          >
            <span>تنظیماتِ SEO</span>
            <span className="text-fog text-xs">{showSeo ? "بستن" : "باز کردن"}</span>
          </button>
          {showSeo && (
            <div className="mt-3 space-y-3">
              <div>
                <Label>عنوانِ متا</Label>
                <Input value={metaTitle} onChange={setMetaTitle} placeholder="پیش‌فرض: عنوانِ مقاله" />
              </div>
              <div>
                <Label>توضیحِ متا</Label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  placeholder="پیش‌فرض: خلاصهٔ مقاله"
                  className="w-full bg-white/60 border border-black/10 rounded-xl px-3 py-2 text-sm text-ink outline-none resize-y"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ستونِ کناری */}
      <div className="space-y-4">
        {/* انتشار */}
        <div className="rounded-2xl border border-black/8 bg-white/40 p-4 space-y-3">
          <div>
            <Label>وضعیت</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-white/60 border border-black/10 rounded-xl px-3 py-2 text-sm text-ink outline-none"
            >
              {POST_STATUSES.map((s) => (
                <option key={s} value={s}>{POST_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            <span className="text-sm text-stone">مقالهٔ شاخص (بالای فهرست)</span>
          </label>

          <button
            onClick={save}
            disabled={busy}
            className="w-full btn btn-primary justify-center"
            style={{ fontSize: "14px" }}
          >
            {busy && <Spinner size={14} />}
            {mode === "create" ? "ساختِ مقاله" : "ذخیرهٔ تغییرات"}
          </button>

          {mode === "edit" && initial && (
            <a
              href={`/blog/${initial.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs text-sage-deep hover:underline"
            >
              نمایش در سایت ↗
            </a>
          )}
        </div>

        {/* کاور */}
        <div className="rounded-2xl border border-black/8 bg-white/40 p-4">
          <Label>تصویرِ شاخص (کاور)</Label>
          <div className="mt-2">
            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt="کاور" className="w-full aspect-[16/10] object-cover" />
                <button
                  onClick={() => setCoverImage(null)}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full bg-ink/70 text-paper text-xs flex items-center justify-center hover:bg-ink"
                  title="حذفِ کاور"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-[16/10] rounded-xl border border-dashed border-black/15 bg-black/3 flex flex-col items-center justify-center gap-2 text-fog hover:bg-black/5 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L5 21" />
                </svg>
                <span className="text-xs">انتخابِ تصویر</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={onCoverFile} className="hidden" />
          </div>
        </div>

        {/* دسته */}
        <div className="rounded-2xl border border-black/8 bg-white/40 p-4">
          <Label>دسته</Label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-white/60 border border-black/10 rounded-xl px-3 py-2 text-sm text-ink outline-none mt-1"
          >
            <option value="">بدونِ دسته</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="text-[11px] text-fog mt-1.5">هنوز دسته‌ای نساخته‌ای — از تبِ «دسته‌ها» اضافه کن.</p>
          )}
        </div>

        {/* برچسب‌ها */}
        <div className="rounded-2xl border border-black/8 bg-white/40 p-4">
          <Label>برچسب‌ها</Label>
          <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-xs bg-black/5 text-stone rounded-full px-2.5 py-1">
                #{t}
                <button onClick={() => setTags((p) => p.filter((x) => x !== t))} className="text-fog hover:text-ember">✕</button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={onTagKey}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder="برچسب را بنویس و Enter بزن…"
            className="w-full bg-white/60 border border-black/10 rounded-xl px-3 py-2 text-sm text-ink outline-none"
          />
        </div>

        {/* پیشرفته */}
        <div className="rounded-2xl border border-black/8 bg-white/40 p-4">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center justify-between w-full text-sm font-medium text-ink"
          >
            <span>پیشرفته</span>
            <span className="text-fog text-xs">{showAdvanced ? "بستن" : "باز کردن"}</span>
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-3">
              <div>
                <Label>نویسنده</Label>
                <Input value={authorName} onChange={setAuthorName} placeholder="تیم همسو" />
              </div>
              <div>
                <Label>نشانی (slug)</Label>
                <Input value={slug} onChange={setSlug} placeholder="خودکار از عنوان" ltr />
                <p className="text-[11px] text-fog mt-1">آدرسِ مقاله: /blog/{slug || "…"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-stone mb-1">{children}</div>;
}

function Input({ value, onChange, placeholder, ltr }: { value: string; onChange: (v: string) => void; placeholder?: string; ltr?: boolean }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      dir={ltr ? "ltr" : "rtl"}
      className="w-full bg-white/60 border border-black/10 rounded-xl px-3 py-2 text-sm text-ink outline-none"
      style={ltr ? { textAlign: "right" } : undefined}
    />
  );
}
