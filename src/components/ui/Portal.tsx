"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Portal — رندرِ children مستقیماً زیر <body> (خارج از درختِ DOM والد).
//
// چرا لازم است؟ مودال‌هایی با position:fixed وقتی داخلِ یک والدِ دارای
// transform/filter/will-change قرار بگیرند، آن والد «containing block» می‌شود و
// fixed به‌جای viewport نسبت به والد محاسبه می‌شود → مودال در کادرِ والد حبس می‌شود.
// (مثلاً animate-fade-up با fill-mode:both یک transform دائمی نگه می‌دارد.)
// Portal این مشکل را به‌صورت ساختاری حل می‌کند: مودال همیشه فرزندِ مستقیمِ body است.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
