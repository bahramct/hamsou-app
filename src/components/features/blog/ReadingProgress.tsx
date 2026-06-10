"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ReadingProgress — نوارِ باریکِ پیشرفتِ مطالعه (ری‌دیزاین بلاگ، DECISION-068)
// خطی ۲.۵px بالای صفحه که با اسکرولِ بدنهٔ مقاله پر می‌شود — نرم و بی‌صدا.
// prefers-reduced-motion را محترم می‌شمارد (بدون transition).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";

export function ReadingProgress({ targetId }: { targetId: string }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const target = document.getElementById(targetId);
    if (!bar || !target) return;

    let raf = 0;
    function update() {
      raf = 0;
      if (!bar || !target) return;
      const rect = target.getBoundingClientRect();
      const viewH = window.innerHeight;
      // پیشرفت: از ورودِ ابتدای مقاله تا رسیدنِ انتهای آن به پایینِ viewport
      const total = rect.height - viewH * 0.4;
      const passed = Math.min(Math.max(-rect.top + viewH * 0.2, 0), Math.max(total, 1));
      const ratio = total > 0 ? passed / total : 0;
      bar.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);

  return (
    <div
      aria-hidden
      className="fixed top-0 inset-x-0 z-[60] pointer-events-none"
      style={{ height: "2.5px" }}
    >
      <div
        ref={barRef}
        className="h-full"
        style={{
          transformOrigin: "right", // RTL — از راست پر می‌شود
          transform: "scaleX(0)",
          background: "linear-gradient(to left, var(--color-sage), var(--color-mist))",
          opacity: 0.85,
        }}
      />
    </div>
  );
}
