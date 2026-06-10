// ─────────────────────────────────────────────────────────────────────────────
// tiptap-markdown.ts — سریالایزرِ سندِ Tiptap (ProseMirror JSON) → Markdown
// (DECISION-069). فقط زیرمجموعهٔ پشتیبانی‌شده در renderMarkdown تولید می‌شود؛
// پس محتوای DB همان Markdown سازگار با خطِ لولهٔ رندرِ سایت می‌ماند.
// بدون وابستگی — هم‌خانوادهٔ renderer دست‌سازِ خودمان.
// ─────────────────────────────────────────────────────────────────────────────

import type { JSONContent } from "@tiptap/core";

type Mark = NonNullable<JSONContent["marks"]>[number];

/** متنِ خامِ همهٔ فرزندانِ یک نود (برای بلوکِ کد). */
function textOf(node: JSONContent): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textOf).join("");
}

/** سریالِ inline: متن با مارک‌ها + شکستِ خط + تصویرِ درون‌خطی. */
function serializeInline(nodes: JSONContent[] | undefined): string {
  if (!nodes) return "";
  return nodes
    .map((n) => {
      if (n.type === "hardBreak") return "\n";
      if (n.type === "image") {
        const alt = String(n.attrs?.alt ?? "");
        const src = String(n.attrs?.src ?? "");
        return src ? `![${alt}](${src})` : "";
      }
      if (n.type !== "text") return serializeInline(n.content);

      let t = n.text ?? "";
      if (!t) return "";
      const marks: Mark[] = n.marks ?? [];
      const has = (m: string) => marks.some((x) => x.type === m);

      if (has("code")) {
        t = "`" + t + "`";
      } else {
        if (has("bold")) t = `**${t}**`;
        if (has("italic")) t = `*${t}*`;
      }
      const link = marks.find((x) => x.type === "link");
      const href = link ? String(link.attrs?.href ?? "") : "";
      if (href) t = `[${t}](${href})`;
      return t;
    })
    .join("");
}

/** سریالِ آیتم‌های فهرست — تو در تو flatten می‌شود (renderer تک‌سطح است). */
function serializeList(node: JSONContent, marker: () => string): string {
  const lines: string[] = [];
  for (const item of node.content ?? []) {
    const inlineParts: string[] = [];
    const nestedLines: string[] = [];
    for (const child of item.content ?? []) {
      if (child.type === "paragraph") {
        const txt = serializeInline(child.content).replace(/\n/g, " ").trim();
        if (txt) inlineParts.push(txt);
      } else if (child.type === "bulletList") {
        nestedLines.push(serializeList(child, () => "- "));
      } else if (child.type === "orderedList") {
        let k = Number(child.attrs?.start ?? 1);
        nestedLines.push(serializeList(child, () => `${k++}. `));
      }
    }
    if (inlineParts.length > 0) lines.push(marker() + inlineParts.join(" — "));
    lines.push(...nestedLines.filter(Boolean));
  }
  return lines.join("\n");
}

/** سریالِ یک بلوک — null یعنی بلوکِ خالی (حذف می‌شود). */
function serializeBlock(n: JSONContent): string | null {
  switch (n.type) {
    case "paragraph": {
      const txt = serializeInline(n.content);
      return txt.trim() ? txt : null;
    }
    case "heading": {
      const level = Math.min(Math.max(Number(n.attrs?.level ?? 2), 1), 6);
      const txt = serializeInline(n.content).replace(/\n/g, " ").trim();
      return txt ? `${"#".repeat(level)} ${txt}` : null;
    }
    case "blockquote": {
      const inner = (n.content ?? [])
        .map((c) => serializeBlock(c))
        .filter((s): s is string => s !== null)
        .join("\n\n");
      if (!inner) return null;
      return inner
        .split("\n")
        .map((l) => (l ? `> ${l}` : ">"))
        .join("\n");
    }
    case "codeBlock": {
      const lang = String(n.attrs?.language ?? "");
      return "```" + lang + "\n" + textOf(n) + "\n```";
    }
    case "bulletList":
      return serializeList(n, () => "- ") || null;
    case "orderedList": {
      let i = Number(n.attrs?.start ?? 1);
      return serializeList(n, () => `${i++}. `) || null;
    }
    case "horizontalRule":
      return "---";
    case "image": {
      const alt = String(n.attrs?.alt ?? "");
      const src = String(n.attrs?.src ?? "");
      return src ? `![${alt}](${src})` : null;
    }
    default: {
      const txt = serializeInline(n.content);
      return txt.trim() ? txt : null;
    }
  }
}

/** سندِ کاملِ Tiptap → Markdown (سازگار با renderMarkdown خودمان). */
export function tiptapToMarkdown(doc: JSONContent): string {
  const blocks = (doc.content ?? [])
    .map((n) => serializeBlock(n))
    .filter((s): s is string => s !== null);
  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}
