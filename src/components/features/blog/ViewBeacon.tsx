"use client";

import { useEffect, useRef } from "react";

// beaconِ بازدید — یک‌بار پس از mountِ صفحهٔ مقاله، شمارندهٔ بازدید را افزایش می‌دهد.
// در RSC انجام نمی‌شود تا با caching تداخل نکند (DECISION-065).
export function ViewBeacon({ slug }: { slug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const key = `blog-viewed-${slug}`;
    // در یک نشستِ مرورگر، هر مقاله یک‌بار شمارش می‌شود
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch(`/api/blog/${encodeURIComponent(slug)}/view`, { method: "POST" }).catch(() => {});
  }, [slug]);
  return null;
}
