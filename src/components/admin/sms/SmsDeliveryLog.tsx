"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SmsDeliveryLog — جدول آخرین ارسال‌های پیامک (DECISION-061) — presentational
// «اطمینان»: بعد از ورود کاربر در سایت، رکورد تازه نشان می‌دهد از کدام مسیر (smsir/mock) رفت.
// تاریخ: جلالی + ارقام فارسی (toLocaleString fa-IR). شناسهٔ فنی (messageId) لاتین می‌ماند.
// ─────────────────────────────────────────────────────────────────────────────

import { Spinner } from "@/components/ui/Spinner";
import { toFaDigits } from "@/lib/utils/digits";

export interface SmsLogView {
  id: string;
  provider: string;
  purpose: string;
  purposeLabel: string;
  phoneMasked: string;
  success: boolean;
  status: number | null;
  messageId: string | null;
  error: string | null;
  isSandbox: boolean;
  createdAt: string; // ISO
}

const PROVIDER_LABEL: Record<string, string> = { smsir: "sms.ir", mock: "Mock" };

function faDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fa-IR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function SmsDeliveryLog({
  logs, loading, onRefresh,
}: {
  logs: SmsLogView[];
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-2xl border border-black/8 bg-white/40 p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-ink">تاریخچهٔ ارسال</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-black/6 text-stone hover:bg-black/10 transition-colors disabled:opacity-40"
        >
          {loading && <Spinner />}
          تازه‌سازی
        </button>
      </div>
      <p className="text-xs text-fog mb-4">
        هر ارسال (ورود کاربر، افزودن موبایل، یا تست) اینجا ثبت می‌شود. ستونِ «مسیر» نشان می‌دهد از کدام سرویس رفته — همین تأیید می‌کند ورود از مسیر sms.ir می‌گذرد نه آزمایشی.
      </p>

      {logs.length === 0 ? (
        <p className="text-[11px] text-fog bg-black/3 rounded-lg px-3 py-2">
          هنوز ارسالی ثبت نشده. یک «ارسال تستی» بزن یا در سایت با OTP وارد شو، بعد تازه‌سازی کن.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="text-fog text-right border-b border-black/8">
                <th className="font-medium px-2 py-2">وضعیت</th>
                <th className="font-medium px-2 py-2">مسیر</th>
                <th className="font-medium px-2 py-2">نوع</th>
                <th className="font-medium px-2 py-2">شماره</th>
                <th className="font-medium px-2 py-2">شناسهٔ پیام</th>
                <th className="font-medium px-2 py-2">زمان</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-black/4 last:border-0">
                  <td className="px-2 py-2">
                    {l.success ? (
                      <span className="text-sage-deep">موفق</span>
                    ) : (
                      <span className="text-ember" title={l.error ?? undefined}>ناموفق</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <span className="text-ink num-latin" dir="ltr">{PROVIDER_LABEL[l.provider] ?? l.provider}</span>
                    {l.isSandbox && (
                      <span className="mr-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-700">سندباکس</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-stone">{l.purposeLabel}</td>
                  <td className="px-2 py-2 num-latin" dir="ltr">{toFaDigits(l.phoneMasked)}</td>
                  <td className="px-2 py-2 num-latin text-fog" dir="ltr">{l.messageId ?? "—"}</td>
                  <td className="px-2 py-2 text-stone whitespace-nowrap">{faDateTime(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
