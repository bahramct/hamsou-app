// ─────────────────────────────────────────────────────────────────────────────
// plans/discount-shared.ts — اعتبارسنجی/serialize/اعمال کد تخفیف (DECISION-040)
// مشترک بین API ادمین (CRUD) و endpoint عمومی اعتبارسنجی در /plans.
// SQLite آرایه ندارد → plans/cycles به‌صورت CSV ذخیره می‌شوند ("" = همه).
// ─────────────────────────────────────────────────────────────────────────────

import { PLAN_KEYS } from "@/lib/plans/features";

export type DiscountKind = "percent" | "fixed";
export type BillingCycle = "monthly" | "annual";

const CYCLES: BillingCycle[] = ["monthly", "annual"];

export function csvToArr(csv: string): string[] {
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}
export function arrToCsv(arr: string[]): string {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))].join(",");
}

// ─── ردیف DB (شکل کمینه‌ای که نیاز داریم) ────────────────────────────────────
export interface DiscountRow {
  id: string;
  code: string;
  kind: string;
  value: number;
  plans: string;
  cycles: string;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  note: string | null;
  createdAt: Date;
}

export function serializeDiscount(d: DiscountRow) {
  return {
    id: d.id,
    code: d.code,
    kind: d.kind,
    value: d.value,
    plans: csvToArr(d.plans),
    cycles: csvToArr(d.cycles),
    maxUses: d.maxUses,
    usedCount: d.usedCount,
    startsAt: d.startsAt ? d.startsAt.toISOString() : null,
    expiresAt: d.expiresAt ? d.expiresAt.toISOString() : null,
    isActive: d.isActive,
    note: d.note,
    createdAt: d.createdAt.toISOString(),
  };
}

// ─── اعتبارسنجی بدنهٔ ورودی (create/update) ──────────────────────────────────
export interface ParsedDiscount {
  code?: string;
  kind?: DiscountKind;
  value?: number;
  plans?: string;
  cycles?: string;
  maxUses?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  isActive?: boolean;
  note?: string | null;
}

const CODE_RE = /^[A-Z0-9_-]{3,40}$/;

export function parseDiscountBody(
  body: unknown,
  opts: { requireCode: boolean }
): { ok: true; data: ParsedDiscount } | { ok: false; error: string } {
  const b = body as Record<string, unknown> | null;
  if (!b) return { ok: false, error: "درخواست نامعتبر." };
  const out: ParsedDiscount = {};

  if (b.code !== undefined || opts.requireCode) {
    const code = String(b.code ?? "").trim().toUpperCase();
    if (!CODE_RE.test(code)) {
      return { ok: false, error: "کد باید ۳ تا ۴۰ نویسه (حروف لاتین، عدد، - یا _) باشد." };
    }
    out.code = code;
  }

  if (b.kind !== undefined || opts.requireCode) {
    const kind = String(b.kind ?? "");
    if (kind !== "percent" && kind !== "fixed") return { ok: false, error: "نوع تخفیف نامعتبر." };
    out.kind = kind;
  }

  if (b.value !== undefined || opts.requireCode) {
    const n = Number(b.value);
    const kind = out.kind ?? "fixed";
    if (!Number.isFinite(n) || n < 0) return { ok: false, error: "مقدار تخفیف نامعتبر." };
    if (kind === "percent" && (n < 1 || n > 100)) return { ok: false, error: "درصد تخفیف باید بین ۱ تا ۱۰۰ باشد." };
    out.value = Math.round(n);
  }

  if (b.plans !== undefined) {
    const arr = Array.isArray(b.plans) ? (b.plans as unknown[]).map(String) : [];
    const bad = arr.find((p) => !(PLAN_KEYS as readonly string[]).includes(p));
    if (bad) return { ok: false, error: `پلن نامعتبر: ${bad}` };
    out.plans = arrToCsv(arr);
  }
  if (b.cycles !== undefined) {
    const arr = Array.isArray(b.cycles) ? (b.cycles as unknown[]).map(String) : [];
    const bad = arr.find((c) => !CYCLES.includes(c as BillingCycle));
    if (bad) return { ok: false, error: `دورهٔ نامعتبر: ${bad}` };
    out.cycles = arrToCsv(arr);
  }

  if (b.maxUses !== undefined) {
    if (b.maxUses === null || b.maxUses === "") out.maxUses = null;
    else {
      const n = Number(b.maxUses);
      if (!Number.isInteger(n) || n < 1) return { ok: false, error: "سقف استفاده باید عدد مثبت یا خالی باشد." };
      out.maxUses = n;
    }
  }

  for (const f of ["startsAt", "expiresAt"] as const) {
    if (b[f] !== undefined) {
      if (b[f] === null || b[f] === "") { out[f] = null; continue; }
      const d = new Date(String(b[f]));
      if (Number.isNaN(d.getTime())) return { ok: false, error: "تاریخ نامعتبر." };
      out[f] = d;
    }
  }

  if (typeof b.isActive === "boolean") out.isActive = b.isActive;
  if (b.note !== undefined) out.note = String(b.note ?? "").trim() || null;

  return { ok: true, data: out };
}

// ─── اعمال تخفیف (مشترک با endpoint عمومی) ───────────────────────────────────
export interface DiscountCheckResult {
  ok: boolean;
  reason?: string;
  /** مبلغ تخفیف به تومان */
  discount?: number;
  finalPrice?: number;
}

/**
 * بررسی اعتبار کد برای یک (پلن, دوره, قیمت) و محاسبهٔ قیمت نهایی.
 * هیچ‌گاه throw نمی‌کند؛ نتیجهٔ ساخت‌یافته برمی‌گرداند.
 */
export function applyDiscount(
  row: DiscountRow,
  planKey: string,
  cycle: BillingCycle,
  price: number,
  now: Date
): DiscountCheckResult {
  if (!row.isActive) return { ok: false, reason: "این کد فعال نیست." };
  if (row.startsAt && now < row.startsAt) return { ok: false, reason: "این کد هنوز فعال نشده است." };
  if (row.expiresAt && now > row.expiresAt) return { ok: false, reason: "این کد منقضی شده است." };
  if (row.maxUses !== null && row.usedCount >= row.maxUses) return { ok: false, reason: "ظرفیت این کد تمام شده است." };

  const plans = csvToArr(row.plans);
  if (plans.length > 0 && !plans.includes(planKey)) return { ok: false, reason: "این کد برای این پلن نیست." };
  const cycles = csvToArr(row.cycles);
  if (cycles.length > 0 && !cycles.includes(cycle)) return { ok: false, reason: "این کد برای این دورهٔ پرداخت نیست." };

  if (price <= 0) return { ok: false, reason: "این پلن رایگان است." };

  const discount = row.kind === "percent"
    ? Math.round((price * row.value) / 100)
    : Math.min(row.value, price);
  const finalPrice = Math.max(0, price - discount);
  return { ok: true, discount, finalPrice };
}
