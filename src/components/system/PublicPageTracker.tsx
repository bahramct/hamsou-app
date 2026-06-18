"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** صفحه عمومی جاری را در sessionStorage ذخیره می‌کند تا بعد از لاگین برگردد */
export function PublicPageTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      sessionStorage.setItem("hamsoo_prev_public", pathname);
    } catch {}
  }, [pathname]);
  return null;
}
