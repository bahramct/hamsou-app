"use client";

// جدول لاگ ارسال ایمیل (آینهٔ SmsDeliveryLog)

import { formatJalaliFromISO } from "@/lib/utils/date";
import { toFaDigits } from "@/lib/utils/digits";

export interface EmailLogView {
  id: string;
  provider: string;
  purpose: string;
  purposeLabel: string;
  emailMasked: string;
  subject: string;
  success: boolean;
  messageId: string | null;
  error: string | null;
  createdAt: string;
}

const PURPOSE_COLORS: Record<string, string> = {
  signup: "bg-sage/15 text-sage-deep",
  "add-email": "bg-mist/20 text-charcoal",
  "password-reset": "bg-amber-100 text-amber-700",
  test: "bg-black/5 text-fog",
};

export function EmailDeliveryLog({ logs }: { logs: EmailLogView[] }) {
  if (!logs.length) {
    return (
      <p className="text-[11px] text-fog bg-black/3 rounded-lg px-3 py-2 text-center">
        هنوز ایمیلی ارسال نشده است.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] text-stone border-collapse">
        <thead>
          <tr className="border-b border-black/5">
            <th className="text-right py-2 px-2 font-medium text-fog">زمان</th>
            <th className="text-right py-2 px-2 font-medium text-fog">گیرنده</th>
            <th className="text-right py-2 px-2 font-medium text-fog">هدف</th>
            <th className="text-right py-2 px-2 font-medium text-fog">سرویس</th>
            <th className="text-right py-2 px-2 font-medium text-fog">وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b border-black/3 hover:bg-black/2 transition-colors">
              <td className="py-2 px-2 whitespace-nowrap" dir="rtl">
                {toFaDigits(formatJalaliFromISO(l.createdAt))}
              </td>
              <td className="py-2 px-2 num-latin" dir="ltr">{l.emailMasked}</td>
              <td className="py-2 px-2">
                <span className={`px-2 py-0.5 rounded-full ${PURPOSE_COLORS[l.purpose] ?? "bg-black/5 text-fog"}`}>
                  {l.purposeLabel}
                </span>
              </td>
              <td className="py-2 px-2 num-latin capitalize">{l.provider}</td>
              <td className="py-2 px-2">
                {l.success ? (
                  <span className="text-sage-deep">موفق ✓</span>
                ) : (
                  <span className="text-ember" title={l.error ?? ""}>ناموفق ✗</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
