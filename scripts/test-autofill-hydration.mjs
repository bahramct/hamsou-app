/**
 * test-autofill-hydration.mjs
 * تریس کامل مشکل hydration mismatch از DisableAutofill
 *
 * اجرا: node scripts/test-autofill-hydration.mjs
 */

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅  ${name}`);
    passed++;
  } catch (e) {
    console.error(`❌  ${name}`);
    console.error(`    → ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ─── شبیه‌سازی DOM ──────────────────────────────────────────────────────────
class MockEl {
  constructor(type = "text") {
    this.type = type;
    this._attrs = {};
  }
  setAttribute(k, v) { this._attrs[k] = v; }
  getAttribute(k)    { return this._attrs[k] ?? null; }
  removeAttribute(k) { delete this._attrs[k]; }
  hasAttribute(k)    { return k in this._attrs; }
}

// ─── کپی منطق DisableAutofill ──────────────────────────────────────────────
function harden(el) {
  const isPw = el.type === "password";
  el.setAttribute("autocomplete", isPw ? "new-password" : "off");
  el.setAttribute("autocorrect", "off");
  el.setAttribute("autocapitalize", "off");
  el.setAttribute("data-lpignore", "true");
  el.setAttribute("data-1p-ignore", "true");
  el.setAttribute("data-form-type", "other");
}

function restore(el) {
  el.removeAttribute("autocomplete");
  el.removeAttribute("autocorrect");
  el.removeAttribute("autocapitalize");
  el.removeAttribute("data-lpignore");
  el.removeAttribute("data-1p-ignore");
  el.removeAttribute("data-form-type");
}

// ════════════════════════════════════════════════════════════════════════════
console.log("\n══ تریس کامل مشکل hydration mismatch ══\n");

// ─── گروه A: خودِ منطق harden / restore ───────────────────────────────────
console.log("─ A. منطق harden / restore ─");

test("A1 — harden تمام attrها را می‌نویسد", () => {
  const el = new MockEl("text");
  harden(el);
  assert(el.getAttribute("autocomplete") === "off",       "autocomplete باید 'off' باشد");
  assert(el.getAttribute("autocorrect")   === "off",       "autocorrect باید 'off' باشد");
  assert(el.getAttribute("autocapitalize") === "off",      "autocapitalize باید 'off' باشد");
  assert(el.getAttribute("data-lpignore") === "true",      "data-lpignore باید 'true' باشد");
});

test("A2 — harden برای password از new-password استفاده می‌کند", () => {
  const el = new MockEl("password");
  harden(el);
  assert(el.getAttribute("autocomplete") === "new-password", "password autocomplete باید 'new-password' باشد");
});

test("A3 — restore تمام attrها را پاک می‌کند", () => {
  const el = new MockEl("text");
  harden(el);
  restore(el);
  assert(!el.hasAttribute("autocomplete"),   "autocomplete باید حذف شود");
  assert(!el.hasAttribute("autocorrect"),    "autocorrect باید حذف شود");
  assert(!el.hasAttribute("autocapitalize"), "autocapitalize باید حذف شود");
});

// ─── گروه B: سناریوی hydration mismatch ──────────────────────────────────
console.log("\n─ B. سناریوی hydration mismatch ─");

test("B1 — [قدیم] بدون restore: Strict Mode مشکل دارد", () => {
  const el = new MockEl("text");

  // اثرِ اول (requestAnimationFrame اجرا می‌شود)
  harden(el);

  // cleanup قدیم: فقط observer.disconnect — attrها در DOM می‌مانند
  // (restore انجام نمی‌شود)

  // ری‌اکت دوباره render می‌کند:
  // VDom: attr ندارد  |  DOM: attr دارد  →  MISMATCH
  const mismatchExists = el.hasAttribute("autocomplete");
  assert(mismatchExists, "بدون restore، attr در DOM می‌ماند و mismatch ایجاد می‌کند ← این تأیید مشکل است");
});

test("B2 — [جدید] با restore: Strict Mode مشکل ندارد", () => {
  const el = new MockEl("text");

  // اثرِ اول
  harden(el);
  assert(el.hasAttribute("autocomplete"), "بعد از هارن، attr موجود است");

  // cleanup جدید: restore هم اجرا می‌شود
  restore(el);
  assert(!el.hasAttribute("autocomplete"), "بعد از cleanup، attr حذف شده");

  // ری‌اکت دوباره render می‌کند:
  // VDom: attr ندارد  |  DOM: attr ندارد  →  MATCH ✓
  const mismatch = el.hasAttribute("autocomplete");
  assert(!mismatch, "بعد از restore، DOM با VDom تطابق دارد");

  // اثرِ دوم (re-mount)
  harden(el);
  assert(el.hasAttribute("autocomplete"), "بعد از اثرِ دوم، attr دوباره موجود است");
});

test("B3 — cancelAnimationFrame جلوی harden را قبل از cleanup می‌گیرد", () => {
  const rafQueue = [];
  const mockRaf    = (cb) => { rafQueue.push(cb); return rafQueue.length; };
  const mockCancel = (id) => { rafQueue[id - 1] = null; };

  const el = new MockEl("text");

  // شبیه‌سازی useEffect: raf هنوز فایر نشده
  const rafId = mockRaf(() => harden(el));
  assert(!el.hasAttribute("autocomplete"), "قبل از raf، attr نباید موجود باشد");

  // cleanup: cancel + restore
  mockCancel(rafId);
  restore(el); // چیزی برای restore نیست، ولی ضرری هم ندارد

  // اثرِ دوم: raf جدید
  const rafId2 = mockRaf(() => harden(el));

  // raf اول cancel شد — فایر نمی‌کند
  if (rafQueue[rafId - 1]) rafQueue[rafId - 1]();
  assert(!el.hasAttribute("autocomplete"), "raf اول cancel شده، attr نباید موجود باشد");

  // raf دوم فایر می‌کند
  if (rafQueue[rafId2 - 1]) rafQueue[rafId2 - 1]();
  assert(el.hasAttribute("autocomplete"), "raf دوم موفق — attr موجود است");
});

// ─── گروه C: suppressHydrationWarning و autoComplete در JSX ───────────────
console.log("\n─ C. راه‌حل‌های JSX ─");

test("C1 — اگر JSX صریحاً autoComplete='off' داشته باشد: server=client → بدون mismatch", () => {
  // Server render: JSX با autoComplete="off"
  const serverEl = new MockEl("text");
  serverEl.setAttribute("autocomplete", "off"); // شبیه Next.js SSR

  // Client render: همان JSX
  const clientEl = new MockEl("text");
  clientEl.setAttribute("autocomplete", "off");

  // مقایسه hydration
  assert(
    serverEl.getAttribute("autocomplete") === clientEl.getAttribute("autocomplete"),
    "server و client هر دو 'off' دارند — بدون mismatch"
  );
});

test("C2 — بدون attr صریح در JSX: server ندارد، client ندارد → بدون mismatch تا DisableAutofill نیاید", () => {
  const serverEl = new MockEl("text"); // server render: بدون attr
  const clientEl = new MockEl("text"); // client render: بدون attr

  const match = serverEl.getAttribute("autocomplete") === clientEl.getAttribute("autocomplete");
  assert(match, "هر دو null هستند — بدون mismatch در لحظه hydration");

  // بعد از hydration DisableAutofill می‌آید — این دیگر hydration error نیست
  harden(clientEl);
  // اما React Strict Mode این را double-check می‌کند → B2 این را پوشش می‌دهد
});

// ─── گروه D: جمع‌بندی راه‌حل ──────────────────────────────────────────────
console.log("\n─ D. تأیید راه‌حل نهایی ─");

test("D1 — راه‌حل کامل: restore در cleanup + cancelAnimationFrame", () => {
  const rafQueue = [];
  let rafCounter = 0;
  const mockRaf    = (cb) => { const id = ++rafCounter; rafQueue[id] = cb; return id; };
  const mockCancel = (id) => { rafQueue[id] = null; };

  const inputs = [new MockEl("text"), new MockEl("tel"), new MockEl("password")];

  // === React Strict Mode Double-Invoke ===

  // mount اول
  const raf1 = mockRaf(() => inputs.forEach(harden));
  // (raf هنوز pending است)

  // --- ری‌اکت: حالا cleanup ←→ remount ادامه دهد ---
  // cleanup
  mockCancel(raf1);
  inputs.forEach(restore);
  assert(inputs.every(el => !el.hasAttribute("autocomplete")), "cleanup: همه attrها حذف شدند");

  // mount دوم
  const raf2 = mockRaf(() => inputs.forEach(harden));
  // raf1 cancel شده
  if (rafQueue[raf1]) { rafQueue[raf1](); }
  assert(inputs.every(el => !el.hasAttribute("autocomplete")), "raf1 cancel شده، attrی اضافه نشده");

  // raf2 فایر می‌کند
  if (rafQueue[raf2]) { rafQueue[raf2](); }
  assert(inputs.every(el => el.hasAttribute("autocomplete")), "raf2 فایر کرده — همه attrها موجودند ✓");
});

// ════════════════════════════════════════════════════════════════════════════
console.log(`\n${"─".repeat(48)}`);
console.log(`نتیجه: ${passed} تست موفق، ${failed} تست ناموفق`);
if (failed > 0) {
  console.error("\n⛔ تست ناموفق — قبل از fix اعمال نکن!\n");
  process.exit(1);
}
console.log("\n✅ تمام حالات تأیید شدند — fix اعمال می‌شود.\n");
