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
export type NotificationIcon = "support" | "plan" | "report" | "info" | "wallet";

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

  // شارژ کیف‌پول تأیید شد (producer: admin approve topup) — DECISION-062
  "wallet.topup.approved": {
    tone: "success",
    icon: "wallet",
    describe: (d) => {
      const amount = typeof d.amount === "number" ? d.amount : Number(str(d.amount) ?? 0);
      return {
        title: "کیف‌پول شارژ شد",
        body: amount > 0 ? `${amount.toLocaleString("fa-IR")} تومان به کیف‌پول شما اضافه شد.` : "کیف‌پول شما شارژ شد.",
        link: "/wallet",
      };
    },
  },

  // شارژ کیف‌پول رد شد (producer: admin reject topup) — DECISION-062
  "wallet.topup.rejected": {
    tone: "neutral",
    icon: "wallet",
    describe: (d) => {
      const reason = str(d.reason);
      return {
        title: "شارژ کیف‌پول تأیید نشد",
        body: reason ? `دلیل: ${reason}` : "درخواست شارژ شما تأیید نشد. با پشتیبانی در تماس باش.",
        link: "/wallet",
      };
    },
  },

  // انقضای پلن — بازگشت خودکار به رایگان (producer: getEffectivePlan) — DECISION-062
  "plan.expired": {
    tone: "neutral",
    icon: "plan",
    describe: () => ({
      title: "پلن شما به پایان رسید",
      body: "حساب شما به پلن رایگان بازگشت. برای تمدید، از کیف‌پول پلن دلخواه را بخر.",
      link: "/plans",
    }),
  },

  // هشدار ۳ روز مانده به انقضای پلن (producer: getEffectivePlan) — DECISION-062
  "plan.expiring_soon": {
    tone: "neutral",
    icon: "plan",
    describe: (d) => {
      const daysLeft = typeof d.daysLeft === "number" ? d.daysLeft : null;
      const label = str(d.planLabel) ?? str(d.plan);
      return {
        title: "پلن شما به‌زودی تمام می‌شود",
        body:
          daysLeft != null && label
            ? `${daysLeft.toLocaleString("fa-IR")} روز تا پایان پلن «${label}». برای تمدید اقدام کن.`
            : "پلن شما به‌زودی منقضی می‌شود. برای تمدید اقدام کن.",
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
