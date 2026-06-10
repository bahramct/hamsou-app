// ─────────────────────────────────────────────────────────────────────────────
// ThemeScript — ستِ data-theme روی <html> قبل از اولین paint (بدون فلش)
// منبع حقیقت: localStorage("hamsoo-theme") ∈ "light" | "dark" | "system"
// نبود مقدار = system. این اسکریپت inline و blocking است؛ React بعداً فقط
// از طریق ThemeToggle همین اتریبیوت را تغییر می‌دهد.
// ─────────────────────────────────────────────────────────────────────────────

const THEME_INIT = `(function(){try{var p=localStorage.getItem("hamsoo-theme");var d=p==="dark"||((!p||p==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
