// ─────────────────────────────────────────────────────────────────────────────
// Prompt Loader — می‌خواند از پوشه /prompts (خارج از src/)
// DECISION-029: پرامپت‌ها در ریشه پروژه، نسخه‌پذیر، locale-aware
//
// قرارداد فایل:
//   prompts/<role>/v<n>.<locale>.md
//
// ساختار محتوا:
//   ---
//   role: weekly-report
//   version: 1.0.0
//   locale: fa
//   jsonMode: true
//   ---
//
//   ## SYSTEM
//   ... متن نقش ...
//
//   ## USER
//   ... متن کاربر با placeholder های {{VAR_NAME}} ...
//
// placeholder ها: {{VARIABLE_NAME}} — هر متغیر unknown → خطا (fail-fast)
// ─────────────────────────────────────────────────────────────────────────────

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { IS_DEV_MODE } from "@/lib/env";
import { prisma } from "@/lib/db/client";
import type { AILocale } from "@/lib/ai/types";

interface ParsedPromptFile {
  systemTemplate: string;
  userTemplate: string;
  frontmatter: {
    role: string;
    version: string;
    locale: string;
    jsonMode?: boolean;
  };
}

// در prod: cache یک بار از disk می‌خواند. در dev: همیشه از disk می‌خواند.
const promptCache = new Map<string, ParsedPromptFile>();

const PROMPTS_DIR = process.env.PROMPTS_DIR
  ? process.env.PROMPTS_DIR
  : join(process.cwd(), "prompts");

function cacheKey(roleId: string, version: string, locale: AILocale): string {
  return `${roleId}@${version}:${locale}`;
}

async function loadPromptFile(
  roleId: string,
  version: string,
  locale: AILocale
): Promise<ParsedPromptFile> {
  const key = cacheKey(roleId, version, locale);
  if (!IS_DEV_MODE && promptCache.has(key)) {
    return promptCache.get(key)!;
  }

  const path = join(PROMPTS_DIR, roleId, `v${majorVersion(version)}.${locale}.md`);

  let raw: string;
  try {
    raw = await readFile(path, "utf-8");
  } catch (err) {
    throw new Error(
      `[PromptLoader] فایل پرامپت پیدا نشد: ${path}\n` +
        `نقش: ${roleId} v${version} (${locale})\n` +
        `چاره: فایل را در پوشه prompts/${roleId}/ بساز.`
    );
  }

  const parsed = matter(raw);
  const frontmatter = parsed.data as ParsedPromptFile["frontmatter"];

  // اعتبارسنجی frontmatter
  if (!frontmatter.role || !frontmatter.version || !frontmatter.locale) {
    throw new Error(
      `[PromptLoader] frontmatter ناقص در ${path} — باید شامل role/version/locale باشد.`
    );
  }
  if (frontmatter.role !== roleId) {
    throw new Error(
      `[PromptLoader] role در frontmatter ("${frontmatter.role}") با درخواست ("${roleId}") match نمی‌کند.`
    );
  }

  // جداسازی sections — قرارداد: ## SYSTEM و ## USER
  const { systemTemplate, userTemplate } = splitSections(parsed.content, path);

  const result: ParsedPromptFile = {
    systemTemplate,
    userTemplate,
    frontmatter,
  };

  promptCache.set(key, result);
  return result;
}

function majorVersion(semver: string): string {
  return semver.split(".")[0] ?? "1";
}

function splitSections(
  body: string,
  path: string
): { systemTemplate: string; userTemplate: string } {
  const systemMatch = body.match(/##\s*SYSTEM\s*\n([\s\S]*?)(?=\n##\s*USER\s*\n|$)/i);
  const userMatch = body.match(/##\s*USER\s*\n([\s\S]*)$/i);

  if (!systemMatch || !userMatch) {
    throw new Error(
      `[PromptLoader] فایل ${path} باید دقیقاً دو section با عنوان "## SYSTEM" و "## USER" داشته باشد.`
    );
  }

  return {
    systemTemplate: systemMatch[1].trim(),
    userTemplate: userMatch[1].trim(),
  };
}

/**
 * substitute placeholder های {{VAR_NAME}} با مقادیر داده‌شده.
 * اگر template به {{VAR}} ارجاع بدهد ولی در variables نباشد → خطا (fail-fast).
 *
 * توجه: چک «unused» حذف شد — چون SYSTEM و USER یک set متغیر مشترک می‌گیرند
 * اما هر section فقط subset ای از آن‌ها را استفاده می‌کند. این intentional است.
 */
function substitute(template: string, variables: Record<string, string>): string {
  const placeholderRegex = /\{\{\s*([A-Z][A-Z0-9_]*)\s*\}\}/g;

  return template.replace(placeholderRegex, (_, name: string) => {
    const value = variables[name];
    if (value === undefined) {
      throw new Error(
        `[PromptLoader] placeholder "{{${name}}}" مقدار ندارد. ` +
          `متغیرهای موجود: ${Object.keys(variables).join(", ") || "(هیچ)"}`
      );
    }
    return value;
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface LoadPromptParams {
  roleId: string;
  version: string;
  locale: AILocale;
  variables: Record<string, string>;
}

/**
 * بارگذاری و رندر پرامپت — اول override فعال DB (DECISION-037)، سپس فایل /prompts.
 *
 * محافظ ساختاری: فایل همیشه به‌عنوان منبع frontmatter و fallback خوانده می‌شود.
 * اگر override فعالی در DB باشد، فقط متن system/user جایگزین می‌شود.
 * هر خطا در خواندن override → fallback خودکار به فایل.
 */
export async function loadPrompt(params: LoadPromptParams): Promise<{
  systemPrompt: string;
  userPrompt: string;
  jsonMode: boolean;
}> {
  const file = await loadPromptFile(params.roleId, params.version, params.locale);

  let systemTemplate = file.systemTemplate;
  let userTemplate = file.userTemplate;

  const override = await getActivePromptOverride(params.roleId, params.locale);
  if (override) {
    systemTemplate = override.systemTemplate;
    userTemplate = override.userTemplate;
  }

  return {
    systemPrompt: substitute(systemTemplate, params.variables),
    userPrompt: substitute(userTemplate, params.variables),
    jsonMode: Boolean(file.frontmatter.jsonMode),
  };
}

/**
 * override فعال پرامپت از DB — یا null اگر نبود/خطا (fallback به فایل).
 * هیچ‌گاه throw نمی‌کند.
 */
async function getActivePromptOverride(
  roleId: string,
  locale: AILocale
): Promise<{ systemTemplate: string; userTemplate: string } | null> {
  try {
    const row = await prisma.aiPromptOverride.findFirst({
      where: { roleKey: roleId, locale, isActive: true },
      select: { systemTemplate: true, userTemplate: true },
    });
    return row ?? null;
  } catch {
    return null;
  }
}

/**
 * متن پیش‌فرضِ فایل یک نقش (بدون اعمال override) — برای پنل ادمین:
 * نمایش پیش‌فرض و «بازگشت به نسخهٔ فایل».
 */
export async function getFilePromptTemplates(
  roleId: string,
  version: string,
  locale: AILocale
): Promise<{ systemTemplate: string; userTemplate: string }> {
  const file = await loadPromptFile(roleId, version, locale);
  return { systemTemplate: file.systemTemplate, userTemplate: file.userTemplate };
}

/** پاک کردن cache — فقط در dev برای force reload */
export function _clearPromptCache(): void {
  promptCache.clear();
}
