"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LandingEffects — مدیریت افکت‌های JS صفحه لندینگ
//
// این کامپوننت هیچ UI ندارد — فقط دو اثر جاوااسکریپت را فعال می‌کند:
// ۱. Reveal on scroll: کلاس `in` به المان‌های `.reveal` هنگام ورود به viewport اضافه می‌شود.
// ۲. Parallax ملایم: blob های پس‌زمینه با اسکرول کمی حرکت می‌کنند.
//
// چرا یک کامپوننت جدا؟ چون صفحه اصلی (page.tsx) Server Component است.
// این جداسازی باعث می‌شود HTML صفحه لندینگ در سرور رندر شود (SEO بهتر، FCP سریع‌تر)
// و فقط این منطق کوچک به bundle کلاینت اضافه شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";

export function LandingEffects() {
  useEffect(() => {
    // ─── ۱. Reveal on scroll ────────────────────────────────────────────────
    const reveals = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    reveals.forEach((el) => observer.observe(el));

    // ─── ۲. Parallax ملایم روی blob ها ─────────────────────────────────────
    const blobs = document.querySelectorAll<HTMLElement>(".blob");
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          blobs.forEach((blob, i) => {
            const dir = i % 2 === 0 ? 1 : -1;
            blob.style.transform = `translateY(${y * 0.08 * dir}px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
