// ─────────────────────────────────────────────────────────────────────────────
// AmbientField — میدانِ گرادیانِ نرمِ پس‌زمینهٔ اپ (UI refactor، DECISION-051)
//
// canvasِ مشترکِ صفحاتِ احرازهویت‌شده: چند blobِ گرادیانِ بسیار نرم + وینیِت ملایم.
// زیرِ محتوا (z-0)، بدون تعامل. حرکت کند و آرام؛ زیر prefers-reduced-motion ساکن.
// فلسفه: عمق و اتمسفر، نه شلوغی — وفادار به «سکوت بصری» مانیفست.
// ─────────────────────────────────────────────────────────────────────────────

export function AmbientField() {
  return (
    <>
      <div className="app-stage" aria-hidden>
        <span className="app-blob app-blob-1" />
        <span className="app-blob app-blob-2" />
        <span className="app-blob app-blob-3" />
      </div>
      <div className="app-vignette" aria-hidden />
    </>
  );
}
