"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RichMarkdownEditor — ادیتورِ حرفه‌ای مقاله (Tiptap → Markdown، DECISION-069)
// WYSIWYG کامل (تولبار، عکس، نقل‌قول، فهرست، کد، لینک) اما خروجی/ورودی همیشه
// Markdown است → مدلِ داده و خطِ لولهٔ رندرِ سایت دست‌نخورده می‌ماند (هم‌ترازی).
// حالتِ «متنی»: ویرایشِ خامِ Markdown برای کاربرانِ حرفه‌ای.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { renderMarkdown } from "@/lib/blog/markdown";
import { tiptapToMarkdown } from "@/lib/blog/tiptap-markdown";
import { compressImage } from "@/lib/utils/compress-image";
import { toast } from "@/lib/notifications/toast";

const BODY_IMG_MAX_W = 1400;
const BODY_IMG_QUALITY = 0.82;

interface Props {
  value: string;
  onChange: (md: string) => void;
  placeholder?: string;
}

// ─── آیکون‌های تولبار ────────────────────────────────────────────────────────
function I({ d, w = 15 }: { d: string; w?: number }) {
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function RichMarkdownEditor({ value, onChange, placeholder }: Props) {
  const [source, setSource] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        underline: false,
        link: { openOnClick: false, autolink: true },
      }),
      TiptapImage.configure({ allowBase64: true }),
      Placeholder.configure({
        placeholder: placeholder ?? "متنِ مقاله را همین‌جا بنویس…",
      }),
    ],
    content: renderMarkdown(value),
    editorProps: {
      attributes: {
        dir: "rtl",
        class: "tiptap-content prose-article",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(tiptapToMarkdown(editor.getJSON()));
    },
  });

  // وضعیتِ فعالِ دکمه‌های تولبار — رندرِ مجدد فقط با تغییرِ همین مقادیر
  const st = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            strike: editor.isActive("strike"),
            code: editor.isActive("code"),
            h2: editor.isActive("heading", { level: 2 }),
            h3: editor.isActive("heading", { level: 3 }),
            h4: editor.isActive("heading", { level: 4 }),
            quote: editor.isActive("blockquote"),
            bullet: editor.isActive("bulletList"),
            ordered: editor.isActive("orderedList"),
            codeBlock: editor.isActive("codeBlock"),
            link: editor.isActive("link"),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
          }
        : null,
  });

  function switchMode() {
    if (!source && editor) {
      // visual → source: مقدارِ markdown همین حالا sync است (onUpdate)
      setSource(true);
    } else {
      // source → visual: متن خام را به سند برگردان
      editor?.commands.setContent(renderMarkdown(value));
      setSource(false);
    }
  }

  function openLink() {
    if (!editor) return;
    const current = (editor.getAttributes("link").href as string | undefined) ?? "";
    setLinkUrl(current);
    setLinkOpen(true);
  }

  function applyLink() {
    if (!editor) return;
    const url = linkUrl.trim();
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setLinkOpen(false);
  }

  async function onImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایلِ تصویری مجاز است.");
      return;
    }
    try {
      const dataUrl = await compressImage(file, BODY_IMG_MAX_W, BODY_IMG_QUALITY);
      editor.chain().focus().setImage({ src: dataUrl, alt: "" }).run();
    } catch {
      toast.error("پردازشِ تصویر انجام نشد.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const btn = (active: boolean | undefined, disabled = false) =>
    `w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-sm
     ${disabled ? "opacity-30 cursor-default" : "cursor-pointer hover:bg-black/6"}
     ${active ? "bg-black/8 text-ink" : "text-stone"}`;

  const run = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(var(--rgb-line),0.10)", background: "rgba(var(--rgb-card),0.35)" }}>
      {/* ─── تولبار ─── */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 sticky top-0 z-10"
        style={{ borderBottom: "1px solid rgba(var(--rgb-line),0.08)", background: "rgba(var(--rgb-card),0.7)", backdropFilter: "blur(10px)" }}
      >
        {!source && editor && (
          <>
            <button type="button" title="واگرد" disabled={!st?.canUndo} className={btn(false, !st?.canUndo)} onMouseDown={run(() => editor.chain().focus().undo().run())}>
              <I d="M3 7v6h6M3 13a9 9 0 1 0 3-7.7" />
            </button>
            <button type="button" title="ازنو" disabled={!st?.canRedo} className={btn(false, !st?.canRedo)} onMouseDown={run(() => editor.chain().focus().redo().run())}>
              <I d="M21 7v6h-6M21 13a9 9 0 1 1-3-7.7" />
            </button>

            <span className="w-px h-5 mx-1" style={{ background: "rgba(var(--rgb-line),0.10)" }} />

            <button type="button" title="عنوانِ بخش (H2)" className={`${btn(st?.h2)} num-latin font-semibold`} onMouseDown={run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>
              H2
            </button>
            <button type="button" title="زیرعنوان (H3)" className={`${btn(st?.h3)} num-latin font-semibold`} onMouseDown={run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>
              H3
            </button>
            <button type="button" title="عنوانِ کوچک (H4)" className={`${btn(st?.h4)} num-latin font-semibold`} onMouseDown={run(() => editor.chain().focus().toggleHeading({ level: 4 }).run())}>
              H4
            </button>

            <span className="w-px h-5 mx-1" style={{ background: "rgba(var(--rgb-line),0.10)" }} />

            <button type="button" title="پررنگ" className={`${btn(st?.bold)} font-bold num-latin`} onMouseDown={run(() => editor.chain().focus().toggleBold().run())}>
              B
            </button>
            <button type="button" title="مورب" className={`${btn(st?.italic)} italic num-latin`} onMouseDown={run(() => editor.chain().focus().toggleItalic().run())}>
              I
            </button>
            <button type="button" title="خط‌خورده" className={`${btn(st?.strike)} line-through num-latin`} onMouseDown={run(() => editor.chain().focus().toggleStrike().run())}>
              S
            </button>
            <button type="button" title="کدِ درون‌خطی" className={btn(st?.code)} onMouseDown={run(() => editor.chain().focus().toggleCode().run())}>
              <I d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
            </button>
            <button type="button" title="لینک" className={btn(st?.link)} onMouseDown={run(openLink)}>
              <I d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
            </button>

            <span className="w-px h-5 mx-1" style={{ background: "rgba(var(--rgb-line),0.10)" }} />

            <button type="button" title="نقل‌قول" className={btn(st?.quote)} onMouseDown={run(() => editor.chain().focus().toggleBlockquote().run())}>
              <I d="M3 21c3-1 5-3 5-8V7H3v6h3c0 3-1 5-3 6zM14 21c3-1 5-3 5-8V7h-5v6h3c0 3-1 5-3 6z" />
            </button>
            <button type="button" title="فهرست" className={btn(st?.bullet)} onMouseDown={run(() => editor.chain().focus().toggleBulletList().run())}>
              <I d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
            </button>
            <button type="button" title="فهرستِ شماره‌دار" className={btn(st?.ordered)} onMouseDown={run(() => editor.chain().focus().toggleOrderedList().run())}>
              <I d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
            </button>

            <span className="w-px h-5 mx-1" style={{ background: "rgba(var(--rgb-line),0.10)" }} />

            <button type="button" title="درجِ تصویر" className={btn(false)} onMouseDown={run(() => fileRef.current?.click())}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L5 21" />
              </svg>
            </button>
            <button type="button" title="بلوکِ کد" className={btn(st?.codeBlock)} onMouseDown={run(() => editor.chain().focus().toggleCodeBlock().run())}>
              <I d="M8 9l-3 3 3 3M16 9l3 3-3 3M12 5l-1 14" />
            </button>
            <button type="button" title="خطِ جداکننده" className={btn(false)} onMouseDown={run(() => editor.chain().focus().setHorizontalRule().run())}>
              <I d="M4 12h16" />
            </button>
          </>
        )}

        {/* سوییچِ حالت — toggleِ وضعیت (استثنای DECISION-053) */}
        <button
          type="button"
          onClick={switchMode}
          className="mr-auto text-[11px] px-2.5 py-1.5 rounded-lg bg-black/5 text-stone hover:bg-black/10 transition-colors"
        >
          {source ? "ادیتورِ بصری" : "Markdown خام"}
        </button>
      </div>

      {/* ─── پاپ‌آورِ لینک ─── */}
      {linkOpen && !source && (
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(var(--rgb-line),0.08)", background: "rgba(var(--rgb-card),0.5)" }}>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              } else if (e.key === "Escape") {
                setLinkOpen(false);
              }
            }}
            placeholder="https://…"
            dir="ltr"
            autoFocus
            className="num-latin flex-1 bg-white/60 border border-black/10 rounded-lg px-3 py-1.5 text-xs text-ink outline-none"
          />
          <button type="button" onClick={applyLink} className="text-xs px-3 py-1.5 rounded-lg bg-sage text-paper hover:opacity-90 transition-opacity">
            ثبت
          </button>
          {st?.link && (
            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().extendMarkRange("link").unsetLink().run();
                setLinkOpen(false);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-black/5 text-stone hover:text-ember transition-colors"
            >
              حذفِ لینک
            </button>
          )}
          <button type="button" onClick={() => setLinkOpen(false)} className="text-xs px-2 py-1.5 rounded-lg text-fog hover:text-ink transition-colors">
            ✕
          </button>
        </div>
      )}

      {/* ─── بدنه ─── */}
      {source ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={18}
          dir="rtl"
          placeholder={"## عنوانِ بخش\n\nمتنِ پاراگراف با **تأکید** و *مورب* و [لینک](https://…)."}
          className="w-full bg-transparent outline-none text-sm text-ink leading-relaxed resize-y px-4 py-3"
          style={{ fontFamily: "inherit", minHeight: "340px" }}
        />
      ) : (
        <div className="px-4 py-1 cursor-text" onClick={() => editor?.chain().focus().run()}>
          <EditorContent editor={editor} />
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={onImageFile} className="hidden" />
    </div>
  );
}
