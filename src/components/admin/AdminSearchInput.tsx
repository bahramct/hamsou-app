"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AdminSearchInput — جستجوی زنده در صفحه‌های ادمین (debounce 400ms)
//
// ⚠️ تذکر عملکرد (DECISION-062): هر کلید بعد از 400ms یک request به سرور ارسال
// می‌کند. برای چند ادمین قابل قبول است. اگر در آینده بار سرور مطرح شد
// می‌توان به فیلتر client-side یا Redis cache تبدیل کرد.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  defaultValue: string;
  currentPlan: string;   // مقدار فعلی فیلتر پلن (رشته خالی = همه)
  basePath: string;      // مثال: "/admin/users"
  placeholder?: string;
  className?: string;
}

export function AdminSearchInput({
  defaultValue,
  currentPlan,
  basePath,
  placeholder = "جستجو…",
  className = "",
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestPlan = useRef(currentPlan);
  latestPlan.current = currentPlan;

  // هم‌زمانی با navigation خارجی (مثلاً کلیک روی فیلتر پلن)
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (v.trim()) params.set("q", v.trim());
      if (latestPlan.current) params.set("plan", latestPlan.current);
      router.replace(`${basePath}?${params.toString()}`);
    }, 400);
  }

  return (
    <input
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      dir="rtl"
      autoComplete="off"
      className={`flex-1 min-w-52 rounded-xl px-4 py-2.5 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all ${className}`}
    />
  );
}
