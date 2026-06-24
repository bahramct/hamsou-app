// ─────────────────────────────────────────────────────────────────────────────
// /offline — fallbackِ آفلاینِ PWA (service worker وقتی شبکه نیست این را سرو می‌کند).
// ساده، بدون داده، بدون auth (در PUBLIC_PATHS). لحنِ مانیفستی: آرام، بدون فشار.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata = { title: "آفلاین — همسو" };

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center bg-paper">
      <span className="text-xs tracking-wider text-fog">اتصالِ اینترنت برقرار نیست</span>
      <h1 className="text-xl font-medium text-ink">آفلاین هستی</h1>
      <p className="max-w-xs text-sm leading-loose text-stone">
        وقتی دوباره وصل شدی، همسو همان‌جا که بودی منتظرت است. آرام باش.
      </p>
    </main>
  );
}
