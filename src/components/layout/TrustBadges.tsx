"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TrustBadges — مجوزها در فوتر: نماد اعتماد (e-Namad) + لوگوی تأیید زرین‌پال
// هر دو در کادرهای هم‌سایز کنار هم (خواستهٔ برند). اسکریپت رسمی TrustCode زرین‌پال
// با document.write کار می‌کند که در React/Next اجرا نمی‌شود؛ به‌جای آن همان
// خروجی اسکریپت (تصویر CDN + لینک trustPage با hostname سایت) مستقیم رندر می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

const ENAMAD_LINK =
  "https://trustseal.enamad.ir/?id=741289&Code=6NTv9eYWnDK4uTnjWHuHnead8qkxgg9L";
const ENAMAD_IMG =
  "https://trustseal.enamad.ir/logo.aspx?id=741289&Code=6NTv9eYWnDK4uTnjWHuHnead8qkxgg9L";
const ZARINPAL_IMG = "https://cdn.zarinpal.com/badges/trustLogo/1.png";

function BadgeBox({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-2xl p-3"
      style={{
        width: "104px",
        height: "120px",
        background: "rgba(var(--rgb-card),0.55)",
        border: "1px solid rgba(var(--rgb-line),0.09)",
      }}
    >
      <div className="flex items-center justify-center" style={{ width: "72px", height: "72px" }}>
        {children}
      </div>
      <span className="text-fog text-[10px] text-center leading-tight" style={{ fontWeight: 400 }}>
        {label}
      </span>
    </div>
  );
}

export function TrustBadges() {
  // hostname فقط در کلاینت معلوم است — لینکِ trustPage زرین‌پال به دامنهٔ جاری
  const [host, setHost] = useState("hamsouapp.ir");
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname) {
      setHost(window.location.hostname);
    }
  }, []);

  return (
    <div className="flex items-start gap-3">
      <BadgeBox label="نماد اعتماد الکترونیکی">
        <a href={ENAMAD_LINK} target="_blank" rel="noopener noreferrer" referrerPolicy="origin">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ENAMAD_IMG}
            alt="نماد اعتماد الکترونیکی"
            referrerPolicy="origin"
            style={{ maxWidth: "72px", maxHeight: "72px", objectFit: "contain", cursor: "pointer" }}
          />
        </a>
      </BadgeBox>

      <BadgeBox label="درگاه پرداخت زرین‌پال">
        <a
          href={`https://www.zarinpal.com/trustPage/${host}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            // همان رفتار اسکریپت رسمی: پنجرهٔ کوچک تأیید
            e.preventDefault();
            window.open(
              `https://www.zarinpal.com/trustPage/${host}`,
              "zarinpal_trust",
              "width=450,height=600,scrollbars=yes"
            );
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ZARINPAL_IMG}
            alt="درگاه پرداخت معتبر زرین‌پال"
            style={{ maxWidth: "72px", maxHeight: "72px", objectFit: "contain", cursor: "pointer" }}
          />
        </a>
      </BadgeBox>
    </div>
  );
}
