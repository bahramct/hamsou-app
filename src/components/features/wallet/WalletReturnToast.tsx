"use client";

// ─────────────────────────────────────────────────────────────────────────────
// WalletReturnToast — بازخوردِ بازگشت از درگاهِ پرداخت (DECISION-071)
// callback با ?pay=success|cancel|failed|error برمی‌گرداند؛ این کامپوننت toast
// مناسب می‌زند و query را از URL پاک می‌کند (router.replace) تا با refresh تکرار نشود.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";

export function WalletReturnToast() {
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
        toast.success("کیف‌پول با موفقیت شارژ شد");
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

    // پاک‌کردنِ query از URL و اسکرول به بخش امور مالی
    router.replace("/settings/profile#finance");
    router.refresh();
  }, [router]);

  return null;
}
