// ─────────────────────────────────────────────────────────────────────────────
// کاتالوگ نوتیفیکیشن — منبع حقیقت انواع اعلان (DECISION-046)
//
// همان الگوی permissions.ts / audit-actions.ts / tickets.ts:
//   هر `type` یک ردیف اینجاست. افزودن نوع جدید = یک ردیف، بدون migration و
//   بدون لمس API/UI. متن/تن/آیکن/لینک همه از همین‌جا ساخته می‌شوند.
//
// describe(data) متن را از payload می‌سازد — هر نوع، شکل data خودش را می‌خواند
// (مثل AIRole<TInput,TOutput> که هر نقش schema خودش را دارد).
// تنِ مانیفستی: بدون جشن/ایموجی، بدون فشار — فقط اطلاع آرام.
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationTone = "info" | "success" | "neutral";
export type NotificationIcon = "support" | "plan" | "report" | "info";

export interface NotificationDescriptor {
  title: string;
  body?: string;
  link?: string;
  tone: NotificationTone;
  icon: NotificationIcon;
}

interface CatalogEntry {
  tone: NotificationTone;
  icon: NotificationIcon;
  /** سازندهٔ متن از data — payload اختیاری، همیشه با fallback امن */
  describe: (data: Record<string, unknown>) => {
    title: string;
    body?: string;
    link?: string;
  };
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

// ─── کاتالوگ ──────────────────────────────────────────────────────────────────
const CATALOG: Record<string, CatalogEntry> = {
  // پاسخ پشتیبان به تیکت کاربر (producer: admin reply route)
  "support.replied": {
    tone: "info",
    icon: "support",
    describe: (d) => {
      const subject = str(d.subject);
      const ticketId = str(d.ticketId);
      return {
        title: "پاسخ جدید پشتیبانی",
        body: subject ? `به تیکت «${subject}» پاسخ داده شد.` : "به یکی از تیکت‌های شما پاسخ داده شد.",
        link: ticketId ? `/support/${ticketId}` : "/support",
      };
    },
  },

  // تغییر پلن کاربر توسط ادمین (producer: admin plan route — parity)
  "plan.changed": {
    tone: "success",
    icon: "plan",
    describe: (d) => {
      const label = str(d.planLabel) ?? str(d.plan);
      return {
        title: "پلن حساب شما تغییر کرد",
        body: label ? `پلن فعلی شما: «${label}».` : "پلن حساب شما به‌روزرسانی شد.",
        link: "/plans",
      };
    },
  },

  // گزارش هفتگی آماده شد (رزرو — producer در موج بعد، با زمان‌بندی)
  "report.ready": {
    tone: "info",
    icon: "report",
    describe: (d) => {
      const weekLabel = str(d.weekLabel);
      return {
        title: "گزارش هفتگی آماده است",
        body: weekLabel ? `گزارش هفتهٔ ${weekLabel} آماده شد.` : "گزارش هفتگی جدید آماده شد.",
        link: "/reports/weekly",
      };
    },
  },
};

// ردیف ناشناخته → هرگز crash نمی‌کند (مثل describeAction در audit-actions)
const FALLBACK: CatalogEntry = {
  tone: "neutral",
  icon: "info",
  describe: () => ({ title: "اعلان" }),
};

/**
 * ساخت توصیف نمایشی یک نوتیفیکیشن از روی type + data خام (JSON string).
 * هم در client (ناقوس/لیست) و هم در صورت نیاز در server قابل استفاده است —
 * هیچ وابستگی به React ندارد.
 */
export function describeNotification(
  type: string,
  dataJson: string | null,
  linkOverride?: string | null
): NotificationDescriptor {
  const entry = CATALOG[type] ?? FALLBACK;
  let data: Record<string, unknown> = {};
  if (dataJson) {
    try {
      const parsed = JSON.parse(dataJson);
      if (parsed && typeof parsed === "object") data = parsed as Record<string, unknown>;
    } catch {
      // payload خراب → fallback به متن بدون data
    }
  }
  const out = entry.describe(data);
  return {
    title: out.title,
    body: out.body,
    link: linkOverride ?? out.link,
    tone: entry.tone,
    icon: entry.icon,
  };
}

/** آیا این نوع در کاتالوگ تعریف شده؟ (برای اعتبارسنجی در producer) */
export function isKnownNotificationType(type: string): boolean {
  return type in CATALOG;
}
