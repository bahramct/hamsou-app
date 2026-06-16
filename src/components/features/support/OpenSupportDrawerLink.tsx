"use client";

// ─────────────────────────────────────────────────────────────────────────────
// OpenSupportDrawerLink — لینکِ «پشتیبانی» که دراورِ SupportCenter را در همان صفحه
// باز می‌کند (رویدادِ سراسری open-support-drawer)، بدونِ ترکِ صفحه (DECISION-102 #1).
// ─────────────────────────────────────────────────────────────────────────────

export function OpenSupportDrawerLink({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open-support-drawer"))}
    >
      {children}
    </button>
  );
}
