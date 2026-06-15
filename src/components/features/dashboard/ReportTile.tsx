// ─────────────────────────────────────────────────────────────────────────────
// ReportTile — تایلِ «آخرین گزارشِ هفتگی» (TASK-28؛ مو‌به‌موی dashboard-unified.html: t-report)
// بازهٔ هفته + جملهٔ تأمل + چیپ‌های دسته + CTA. بدونِ گزارش → دعوتِ آرام.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";

export interface ReportTileData {
  hasReport: boolean;
  jalaliStart: string;
  jalaliEnd: string;
  text: string;
  categories: string[];
}

const BAR = ["var(--color-sage)", "var(--color-mist-deep)", "var(--color-gold)"];

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9h16M9 3v4M15 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function Chevron() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ReportTile({ data }: { data: ReportTileData }) {
  return (
    <div className="dsh-tile t-report glass">
      <div className="dsh-lbl">آخرین گزارشِ هفتگی</div>

      {data.hasReport ? (
        <>
          <div className="dsh-report-week fa-num">
            <CalendarIcon />
            {data.jalaliStart} <span style={{ color: "var(--color-fog)" }}>←</span> {data.jalaliEnd}
          </div>
          <p className="dsh-report-quote line-clamp-4">«{data.text}»</p>
          {data.categories.length > 0 && (
            <div className="dsh-report-cats">
              {data.categories.slice(0, 4).map((c, i) => (
                <span key={c} className="dsh-cat">
                  <span className="bar" style={{ background: BAR[i % BAR.length] }} />
                  {c}
                </span>
              ))}
            </div>
          )}
          <div className="dsh-foot">
            <Link href="/reports/weekly" className="dsh-cta">خواندنِ گزارش <Chevron /></Link>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/4 text-stone">
              <CalendarIcon />
            </span>
            <p className="max-w-[18rem] text-[13px] leading-relaxed text-stone">
              هنوز گزارشی نداری. پس از گذشتنِ یک هفته، گزارشِ عمیقِ مسیرت اینجا می‌آید.
            </p>
          </div>
          <div className="dsh-foot">
            <Link href="/reports/weekly" className="dsh-cta">گزارش‌های هفتگی <Chevron /></Link>
          </div>
        </>
      )}
    </div>
  );
}
