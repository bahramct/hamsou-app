// ─────────────────────────────────────────────────────────────────────────────
// /admin/ai — مدیریت AI (DECISION-039)
//   - سرویس‌دهنده‌های AI: CRUD سرویس‌ها per منطقه (مدل/آدرس/کلید/نوع)
//   - اتصال بخش‌ها: هر نقش → سرویس، per منطقه (نبود اتصال → پیش‌فرض منطقه)
//   - پرامپت‌ها: ویرایش Role/Prompt هر نقش (مستقل از مدل)
//   - همدم/چت و پارامتر نقش‌ها: تنظیمات کلید-مقدار
// enforce: ai.read؛ تغییر: ai.manage؛ مشاهدهٔ کلید: فقط Owner
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { requirePermission, can, isOwner } from "@/lib/admin/auth-server";
import { prisma } from "@/lib/db/client";
import { getAiConfigMany } from "@/lib/ai/config";
import {
  AI_ROLES_ADMIN,
  AI_REGIONS,
  AI_CONFIG_KEYS,
  DEFAULT_COMPANION_NAME,
  DEFAULT_CHAT_WELCOME,
  DEFAULT_CHAT_MAX_MESSAGE_LENGTH,
} from "@/lib/ai/admin-catalog";
import { weeklyReportRole } from "@/lib/ai/roles/weekly-report";
import { weeklyReflectionRole } from "@/lib/ai/roles/weekly-reflection";
import { chatCompanionRole } from "@/lib/ai/roles/chat-companion";
import { AiSettingsForm, type AiSettingsData } from "@/components/admin/ai/AiSettingsForm";
import { AiServicesManager, type ServiceView } from "@/components/admin/ai/AiServicesManager";
import { AiBindingsForm } from "@/components/admin/ai/AiBindingsForm";

export const dynamic = "force-dynamic";

const ROLE_META: Record<string, { temp: number; maxTokens: number }> = {
  "weekly-report": {
    temp: weeklyReportRole.meta.defaultTemperature ?? 0.7,
    maxTokens: weeklyReportRole.meta.maxOutputTokens ?? 1000,
  },
  "weekly-reflection": {
    temp: weeklyReflectionRole.meta.defaultTemperature ?? 0.75,
    maxTokens: weeklyReflectionRole.meta.maxOutputTokens ?? 600,
  },
  "chat-companion": {
    temp: chatCompanionRole.meta.defaultTemperature ?? 0.85,
    maxTokens: chatCompanionRole.meta.maxOutputTokens ?? 500,
  },
};

export default async function AiPage() {
  const ctx = await requirePermission("ai.read");
  const canManage = can(ctx, "ai.manage");
  const owner = isOwner(ctx);

  // ── سرویس‌ها (بدون apiKey — فقط hasKey) ───────────────────────────────────
  const serviceRows = await prisma.aiService.findMany({
    orderBy: [{ region: "asc" }, { kind: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const services: ServiceView[] = serviceRows.map((s) => ({
    id: s.id,
    label: s.label,
    region: s.region,
    kind: s.kind,
    providerType: s.providerType,
    baseURL: s.baseURL,
    model: s.model,
    isActive: s.isActive,
    isDefault: s.isDefault,
    hasKey: Boolean(s.apiKey && s.apiKey.trim()),
    note: s.note,
  }));

  // ── اتصال بخش‌ها (bind.<role>.<region> → serviceId) ──────────────────────
  const bindingKeys = AI_ROLES_ADMIN.flatMap((r) =>
    AI_REGIONS.map((reg) => AI_CONFIG_KEYS.binding(r.key, reg.key))
  );
  const bindingConfig = await getAiConfigMany(bindingKeys);
  const bindings: Record<string, string> = {};
  for (const r of AI_ROLES_ADMIN) {
    for (const reg of AI_REGIONS) {
      const key = AI_CONFIG_KEYS.binding(r.key, reg.key);
      bindings[`${r.key}.${reg.key}`] = bindingConfig[key] ?? "";
    }
  }

  // ── تنظیمات کلید-مقدار (همدم/چت + پارامتر نقش‌ها) ──────────────────────────
  // نکته: سقف پیام چت per-plan به «مدیریت پلن‌ها» منتقل شد (DECISION-040).
  const settingsKeys = [
    AI_CONFIG_KEYS.companionDefaultName,
    AI_CONFIG_KEYS.chatWelcome,
    AI_CONFIG_KEYS.chatMaxMessageLength,
    ...AI_ROLES_ADMIN.flatMap((r) => [
      AI_CONFIG_KEYS.roleTemperature(r.key),
      AI_CONFIG_KEYS.roleMaxTokens(r.key),
    ]),
  ];
  const current = await getAiConfigMany(settingsKeys);

  const defaults: Record<string, string> = {
    [AI_CONFIG_KEYS.companionDefaultName]: DEFAULT_COMPANION_NAME,
    [AI_CONFIG_KEYS.chatWelcome]: DEFAULT_CHAT_WELCOME,
    [AI_CONFIG_KEYS.chatMaxMessageLength]: String(DEFAULT_CHAT_MAX_MESSAGE_LENGTH),
    ...Object.fromEntries(
      AI_ROLES_ADMIN.flatMap((r) => [
        [AI_CONFIG_KEYS.roleTemperature(r.key), String(ROLE_META[r.key]?.temp ?? 0.7)],
        [AI_CONFIG_KEYS.roleMaxTokens(r.key), String(ROLE_META[r.key]?.maxTokens ?? 1000)],
      ])
    ),
  };

  const settingsData: AiSettingsData = {
    current,
    defaults,
    roles: AI_ROLES_ADMIN.map((r) => ({ key: r.key, label: r.label })),
    canManage,
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-ink">مدیریت هوش مصنوعی</h1>
        <p className="text-sm text-stone mt-1 leading-relaxed max-w-xl">
          سرویس‌ها (مدل/آدرس/کلید) را می‌سازی، هر بخش سیستم را به سرویس دلخواه وصل می‌کنی، و پرامپت هر نقش را جدا ویرایش می‌کنی.
        </p>
      </header>

      {/* راهنمای کلی */}
      <div className="rounded-xl bg-mist/15 border border-mist/30 px-4 py-3 text-[12px] leading-relaxed text-charcoal">
        <div className="font-semibold text-ink mb-1">این بخش چه می‌کند؟</div>
        «هوش مصنوعی» مغز همسو را کنترل می‌کند. سه لایهٔ مستقل دارد:
        <b> سرویس‌دهنده‌ها</b> (کدام مدل، با چه کلیدی)، <b>اتصال بخش‌ها</b> (هر بخش از کدام سرویس استفاده کند)،
        و <b>پرامپت‌ها</b> (متنی که نقش AI را تعیین می‌کند — مستقل از مدل). تغییرات اشتباه هرگز سیستم را نمی‌خوابانند؛ همیشه می‌توانی به حالت پیش‌فرض برگردی.
      </div>

      {/* ۱) سرویس‌دهنده‌ها */}
      <AiServicesManager services={services} canManage={canManage} isOwner={owner} />

      {/* ۲) اتصال بخش‌ها */}
      <AiBindingsForm
        roles={AI_ROLES_ADMIN.map((r) => ({ key: r.key, label: r.label, serviceKind: r.serviceKind }))}
        regions={AI_REGIONS.map((r) => ({ key: r.key, label: r.label }))}
        services={services.map((s) => ({
          id: s.id, label: s.label, region: s.region, kind: s.kind, isActive: s.isActive,
        }))}
        bindings={bindings}
        canManage={canManage}
      />

      {/* ۳) پرامپت‌ها — لینک به ویرایشگر هر نقش */}
      <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
        <h2 className="text-sm font-semibold text-ink mb-1">پرامپت‌ها و نقش‌های AI</h2>
        <p className="text-xs text-fog mb-4">
          «پرامپت» دستورالعمل متنی هر نقش است و <b>مستقل از مدل</b> — مدلِ هر بخش را در دو بخش بالا تعیین می‌کنی. هر نقش را جدا، با نسخه‌سازی و امکان بازگشت، ویرایش می‌کنی.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AI_ROLES_ADMIN.map((r) => (
            <Link
              key={r.key}
              href={`/admin/ai/prompts/${r.key}`}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-black/8 bg-white/50 hover:border-black/15 transition-colors"
            >
              <span className="text-sm text-ink">{r.label}</span>
              <span className="text-xs text-ember">ویرایش پرامپت ←</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ۴) همدم/چت و پارامتر نقش‌ها */}
      <AiSettingsForm data={settingsData} />
    </div>
  );
}
