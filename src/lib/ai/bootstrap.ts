// ─────────────────────────────────────────────────────────────────────────────
// AI Bootstrap — ثبت همه نقش‌ها در Registry
//
// مهم: bootstrapped flag روی globalThis ذخیره می‌شود (نه module variable)
// چون در Next.js HMR، ماژول‌ها reload می‌شوند اما globalThis پاک نمی‌شود.
// اگر bootstrapped روی module باشد: پس از hot reload، flag reset می‌شود
// اما aiRegistry هنوز role دارد → register دوباره → throw.
//
// افزودن نقش جدید:
//   1. ساخت prompts/<new-role>/v1.fa.md
//   2. ساخت src/lib/ai/roles/<new-role>/{schema,index}.ts
//   3. import و register در همین فایل
// ─────────────────────────────────────────────────────────────────────────────

import { aiRegistry } from "@/lib/ai/registry";
import { weeklyReportRole } from "@/lib/ai/roles/weekly-report";
import { weeklyReflectionRole } from "@/lib/ai/roles/weekly-reflection";
import { chatCompanionRole } from "@/lib/ai/roles/chat-companion";

const globalForBootstrap = globalThis as unknown as {
  __hamsoo_ai_bootstrapped?: boolean;
};

export function ensureRolesRegistered(): void {
  if (globalForBootstrap.__hamsoo_ai_bootstrapped) return;

  aiRegistry.register(weeklyReportRole);
  aiRegistry.register(weeklyReflectionRole);
  aiRegistry.register(chatCompanionRole);
  // aiRegistry.register(planSuggestionRole);

  globalForBootstrap.__hamsoo_ai_bootstrapped = true;
}
