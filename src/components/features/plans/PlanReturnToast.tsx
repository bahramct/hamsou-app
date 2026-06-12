"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PlanReturnToast — بازخوردِ بازگشت از درگاه برای خرید مستقیم پلن (DECISION-073)
// callback با ?pay=success|cancel|failed|error به /plans برمی‌گرداند؛ این کامپوننت
// toast مناسب می‌زند و query را پاک می‌کند (آینهٔ WalletReturnToast).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";

export function PlanReturnToast() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const params = new URLSearchParams(window.location.search);
    const pay = params.get("pay");
    if (!pay) return;
    handled.current = true;

    switch (pay) {
      case "success":
        toast.success("پرداخت موفق بود — پلنت فعال شد");
        break;
      case "cancel":
        toast.neutral("پرداخت لغو شد.");
        break;
      case "failed":
        toast.error("پرداخت ناموفق بود. اگر مبلغی کسر شد، طی چند دقیقه برمی‌گردد.");
        break;
      default: // error
        toast.error("تراکنش یافت نشد یا نامعتبر بود.");
    }

    router.replace("/plans");
    router.refresh();
  }, [router]);

  return null;
}
