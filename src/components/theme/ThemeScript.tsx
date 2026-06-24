// ─────────────────────────────────────────────────────────────────────────────
// ThemeScript — ستِ data-theme روی <html> قبل از اولین paint (بدون فلش)
// منبع حقیقت: localStorage("hamsoo-theme") ∈ "light" | "dark" | "indigo"
// نبود مقدار = light. ایندیگو روی صفحاتِ پابلیک/ادمین به دارک تنزل می‌یابد
// (هم‌منطق با lib/theme؛ اینجا inline تکرار شده چون اسکریپتِ blocking نمی‌تواند import کند).
// ─────────────────────────────────────────────────────────────────────────────

const THEME_INIT = `(function(){try{
var p=localStorage.getItem("hamsoo-theme");
if(p!=="dark"&&p!=="indigo")p="light";
var path=location.pathname;
var noIndigo=path==="/"||/^\\/(about|contact|privacy|blog|b|terms|share|login|admin|forgot-password|reset-password|verify-email)(\\/|$)/.test(path);
var t=(p==="indigo"&&noIndigo)?"dark":p;
document.documentElement.setAttribute("data-theme",t);
}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
