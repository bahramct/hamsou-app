// ─────────────────────────────────────────────────────────────────────────────
// date-client.ts — توابع تاریخی سبک برای Client Components
// فقط برای UI (مقداردهی اولیه، مقایسه) — منطق اصلی روی سرور است.
// ─────────────────────────────────────────────────────────────────────────────

const IRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;

/** ISO date string برای امروز (به وقت ایران) — برای مقداردهی اولیه DatePicker */
export function getTodayISO(): string {
  const now = new Date(Date.now() + IRAN_OFFSET_MS);
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
