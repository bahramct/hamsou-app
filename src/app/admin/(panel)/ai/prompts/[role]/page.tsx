// ─────────────────────────────────────────────────────────────────────────────
// /admin/ai/prompts/[role] — ویرایشگر پرامپت یک نقش (DECISION-037)
// نمایش پیش‌فرض فایل + نسخه‌های override + ویرایشگر system/user.
// enforce: ai.read (مشاهده)؛ تغییر: ai.manage (در PromptEditor + API)
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, can } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { getAiRoleAdminMeta } from "@/lib/ai/admin-catalog";
import { getFilePromptTemplates } from "@/lib/ai/prompt-loader";
import { weeklyReportRole } from "@/lib/ai/roles/weekly-report";
import { chatCompanionRole } from "@/lib/ai/roles/chat-companion";
import { PromptEditor } from "@/components/admin/ai/PromptEditor";
import type { PromptVersion } from "@/components/admin/ai/PromptEditor";

export const dynamic = "force-dynamic";

const ROLE_VERSION: Record<string, string> = {
  "weekly-report": weeklyReportRole.version,
  "chat-companion": chatCompanionRole.version,
};

function faDate(d: Date): string {
  return d.toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tehran" });
}

export default async function PromptEditorPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const ctx = await requirePermission("ai.read");
  const { role: roleKey } = await params;

  const meta = getAiRoleAdminMeta(roleKey);
  if (!meta) notFound();

  const locale = "fa";
  const fileVersion = ROLE_VERSION[roleKey] ?? "1.0.0";

  let fileDefault: { systemTemplate: string; userTemplate: string };
  try {
    fileDefault = await getFilePromptTemplates(roleKey, fileVersion, locale);
  } catch {
    fileDefault = { systemTemplate: "", userTemplate: "" };
  }

  const overrides = await prisma.aiPromptOverride.findMany({
    where: { roleKey, locale },
    orderBy: { version: "desc" },
    select: {
      version: true,
      isActive: true,
      note: true,
      createdAt: true,
      systemTemplate: true,
      userTemplate: true,
    },
  });

  const versions: PromptVersion[] = overrides.map((o) => ({
    version: o.version,
    isActive: o.isActive,
    note: o.note,
    dateLabel: faDate(o.createdAt),
    systemTemplate: o.systemTemplate,
    userTemplate: o.userTemplate,
  }));

  const active = versions.find((v) => v.isActive) ?? null;

  return (
    <div className="space-y-6">
      <Link href="/admin/ai" className="text-xs text-stone hover:text-ink transition-colors inline-flex items-center gap-1">
        → بازگشت به مدیریت AI
      </Link>

      <header>
        <h1 className="text-xl font-semibold text-ink">ویرایش پرامپت: {meta.label}</h1>
        <p className="text-sm text-stone mt-1">
          {active
            ? `نسخهٔ فعال: override #${active.version.toLocaleString("fa-IR")}`
            : "نسخهٔ فعال: پیش‌فرض فایل (بدون override)"}
        </p>
      </header>

      <PromptEditor
        roleKey={roleKey}
        roleLabel={meta.label}
        locale={locale}
        variables={meta.variables}
        fileDefault={fileDefault}
        versions={versions}
        activeVersion={active?.version ?? null}
        canManage={can(ctx, "ai.manage")}
      />
    </div>
  );
}
