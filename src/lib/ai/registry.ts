// ─────────────────────────────────────────────────────────────────────────────
// AI Registry — Singleton
// ثبت/کشف نقش‌های AI. هر نقش با id + version ثبت می‌شود.
//
// قانون: کد فیچر هرگز مستقیماً registry.get() را صدا نمی‌زند —
// همیشه از orchestrator.invoke(roleId, input, ctx) استفاده شود.
// ─────────────────────────────────────────────────────────────────────────────

import type { AIRole } from "@/lib/ai/types";

type AnyRole = AIRole<unknown, unknown>;

class AIRegistry {
  // key: `${id}@${version}` — نگه‌داری چندنسخه‌ای
  private roles = new Map<string, AnyRole>();
  // key: id — آخرین نسخه ثبت‌شده
  private latestVersion = new Map<string, string>();

  register<I, O>(role: AIRole<I, O>): void {
    const key = this.makeKey(role.id, role.version);
    if (this.roles.has(key)) {
      // ثبت دوباره با همان نسخه = نشانه bug
      throw new Error(
        `[AIRegistry] نقش "${role.id}" نسخه "${role.version}" قبلاً ثبت شده — احتمالاً double-register.`
      );
    }
    this.roles.set(key, role as AnyRole);

    // به‌روزرسانی آخرین نسخه (با مقایسه semver-lite — major.minor.patch)
    const current = this.latestVersion.get(role.id);
    if (!current || this.isNewer(role.version, current)) {
      this.latestVersion.set(role.id, role.version);
    }
  }

  get<I, O>(id: string, version?: string): AIRole<I, O> {
    const resolvedVersion = version ?? this.latestVersion.get(id);
    if (!resolvedVersion) {
      throw new Error(
        `[AIRegistry] نقش "${id}" پیدا نشد — آیا در bootstrap.ts ثبت شده؟`
      );
    }
    const key = this.makeKey(id, resolvedVersion);
    const role = this.roles.get(key);
    if (!role) {
      throw new Error(
        `[AIRegistry] نقش "${id}" نسخه "${resolvedVersion}" پیدا نشد.`
      );
    }
    return role as AIRole<I, O>;
  }

  /** فهرست همه نقش‌ها — برای DevAIInspector و admin */
  list(): Array<{ id: string; version: string; description: string }> {
    return Array.from(this.roles.values()).map((r) => ({
      id: r.id,
      version: r.version,
      description: r.meta.description,
    }));
  }

  /** فقط برای تست — در runtime استفاده نشود */
  _resetForTests(): void {
    this.roles.clear();
    this.latestVersion.clear();
  }

  private makeKey(id: string, version: string): string {
    return `${id}@${version}`;
  }

  private isNewer(a: string, b: string): boolean {
    const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
    const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < 3; i++) {
      const da = pa[i] ?? 0;
      const db = pb[i] ?? 0;
      if (da !== db) return da > db;
    }
    return false;
  }
}

// نگه‌داری روی globalThis برای جلوگیری از تکرار در Next.js HMR
const globalForRegistry = globalThis as unknown as {
  __hamsoo_ai_registry?: AIRegistry;
};

export const aiRegistry: AIRegistry =
  globalForRegistry.__hamsoo_ai_registry ?? new AIRegistry();

if (!globalForRegistry.__hamsoo_ai_registry) {
  globalForRegistry.__hamsoo_ai_registry = aiRegistry;
}
