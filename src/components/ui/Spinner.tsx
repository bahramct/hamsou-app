// اسپینرِ کوچکِ درون‌دکمه‌ای — برای نشان دادن «در حال انجام» بدون تغییر متنِ دکمه
// (قاعدهٔ نوتیفیکیشن DECISION-046/053: متن دکمه ثابت، بازخورد با toast).
export function Spinner({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`animate-spin ${className}`}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
