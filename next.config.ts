import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // نشانگرِ dev خودِ Next (لوگوی N، گوشهٔ پایین-چپ) حذف می‌شود چون روی تبِ پروفایلِ
  // نوارِ پایین می‌افتد. overlayِ خطاها همچنان کار می‌کند (DECISION-120).
  devIndicators: false,
};

export default nextConfig;
