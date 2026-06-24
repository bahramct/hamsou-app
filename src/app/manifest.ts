import type { MetadataRoute } from "next";

// ─────────────────────────────────────────────────────────────────────────────
// Web App Manifest — نصب‌پذیریِ PWA (DECISION-121).
// Next این فایل را به /manifest.webmanifest سرو می‌کند و خودکار <link rel="manifest">
// به <head> اضافه می‌کند. آیکون‌ها در public/icons/ از لوگو ساخته شده‌اند (آیکونِ اولیه).
// ─────────────────────────────────────────────────────────────────────────────
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "همسو — برای واقعی‌تر زندگی کردن",
    short_name: "همسو",
    description: "یک تعهد در روز. یک پرسش آرام فردا. همسو، آینه‌ای برای صادق ماندن با خود.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F2EB",
    theme_color: "#F5F2EB",
    lang: "fa",
    dir: "rtl",
    categories: ["lifestyle", "productivity", "health"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
