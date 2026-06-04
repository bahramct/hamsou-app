// /admin/denied — صفحه «دسترسی ندارید» (requirePermission به اینجا redirect می‌کند)

import Link from "next/link";

export default function DeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-ember/10 text-ember flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M12 8v4M12 15.5h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="text-lg font-semibold text-ink">دسترسی نداری</h1>
      <p className="text-sm text-stone max-w-xs leading-relaxed">
        نقش فعلی تو اجازه دسترسی به این بخش را ندارد. اگر فکر می‌کنی اشتباهی رخ داده، با مالک سیستم تماس بگیر.
      </p>
      <Link
        href="/admin"
        className="mt-2 text-sm text-ember hover:underline transition-colors"
      >
        بازگشت به داشبورد
      </Link>
    </div>
  );
}
