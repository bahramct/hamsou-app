"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DisableAutofill — قانون سراسری: هیچ Suggestion/Autofill Bubble در هیچ فرم/ورودی
// نمایش داده نشود (در کل سایت و پنل ادمین). (قانون مالک ۲۰۲۶-۰۵-۳۱)
//
// چرا یک enforcer واحد به‌جای ویرایش تک‌تک ۶۰+ ورودی؟
//   - یک نقطهٔ منبع‌حقیقت → آیندهٔ پروژه هم خودکار پوشش داده می‌شود (ورودی‌های جدید).
//   - با MutationObserver، ورودی‌هایی که بعداً (مثلاً در مودال‌ها) اضافه می‌شوند هم پوشش
//     داده می‌شوند.
//
// مکانیزم: روی هر input/textarea مقدار autocomplete را خنثی می‌کنیم:
//   - فیلد رمز → "new-password" (مؤثرترین سرکوب‌کنندهٔ پیشنهاد مرورگر؛ مدیر رمز افزونه‌ای
//     مستقل از این همچنان کار می‌کند).
//   - بقیه → "off" + autocorrect/autocapitalize خاموش.
// نکته: این فقط حبابِ پیشنهاد مرورگر را می‌بندد؛ امنیت یا اعتبارسنجی را تغییر نمی‌دهد.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";

function harden(el: HTMLInputElement | HTMLTextAreaElement) {
  const isPassword = el instanceof HTMLInputElement && el.type === "password";
  // برای رمز، "new-password" بهتر از "off" حبابِ مرورگر را می‌بندد.
  el.setAttribute("autocomplete", isPassword ? "new-password" : "off");
  el.setAttribute("autocorrect", "off");
  el.setAttribute("autocapitalize", "off");
  // data-attributeهای رایج مدیرهای رمز که حبابِ درون‌فیلدی نشان می‌دهند
  el.setAttribute("data-lpignore", "true");
  el.setAttribute("data-1p-ignore", "true");
  el.setAttribute("data-form-type", "other");
}

function hardenAll(root: ParentNode) {
  root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach(harden);
}

// در cleanup باید attrها برداشته شوند تا React Strict Mode (double-invoke)
// بین VDom (بدون attr) و DOM (با attr از اثرِ اول) تفاوت نبیند.
function restoreAll() {
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach((el) => {
    el.removeAttribute("autocomplete");
    el.removeAttribute("autocorrect");
    el.removeAttribute("autocapitalize");
    el.removeAttribute("data-lpignore");
    el.removeAttribute("data-1p-ignore");
    el.removeAttribute("data-form-type");
  });
}

export function DisableAutofill() {
  useEffect(() => {
    // requestAnimationFrame — بعد از اتمام commit/hydration ری‌اکت اجرا می‌شود،
    // از mismatch جلوگیری می‌کند (در صورتی که ری‌اکت هنوز DOM را reconcile می‌کند).
    const rafInit = requestAnimationFrame(() => hardenAll(document));

    // ورودی‌هایی که بعداً به DOM اضافه می‌شوند (مودال، لیست پویا، …) هم پوشش بده.
    const observer = new MutationObserver((mutations) => {
      requestAnimationFrame(() => {
        for (const m of mutations) {
          m.addedNodes.forEach((node) => {
            if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
              harden(node);
            } else if (node instanceof HTMLElement) {
              hardenAll(node);
            }
          });
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(rafInit);
      observer.disconnect();
      restoreAll();
    };
  }, []);

  return null;
}
