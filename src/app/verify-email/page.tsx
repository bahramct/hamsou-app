"use client";

// ─────────────────────────────────────────────────────────────────────────────
// /verify-email — تأییدِ خودکار ایمیل از طریق لینک
// ─────────────────────────────────────────────────────────────────────────────

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AmbientField } from "@/components/layout/AmbientField";

type State = "verifying" | "success" | "error";

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<State>("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState("error");
      setErrorMsg("لینک تأیید نادرست است.");
      return;
    }

    fetch(`/api/auth/email/verify-link?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setState("success");
          setTimeout(() => router.push("/dashboard"), 1500);
        } else {
          setState("error");
          setErrorMsg(data.error ?? "لینک تأیید نادرست یا منقضی شده است.");
        }
      })
      .catch(() => {
        setState("error");
        setErrorMsg("اتصال به سرور برقرار نشد.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative z-10 w-full max-w-sm animate-fade-up text-center space-y-6">
      <div className="flex justify-center">
        <Image src="/logo.png" alt="همسو" width={48} height={48} className="opacity-90" priority />
      </div>

      {state === "verifying" && (
        <>
          <div className="flex justify-center">
            <span className="inline-block w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-stone">در حال تأیید ایمیل…</p>
        </>
      )}

      {state === "success" && (
        <div className="space-y-3">
          <div className="w-14 h-14 rounded-full bg-sage/15 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage-deep">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-ink">ایمیل تأیید شد</h1>
          <p className="text-sm text-stone">در حال انتقال به داشبورد…</p>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-4">
          <div className="w-14 h-14 rounded-full bg-ember/10 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ember">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-ink">تأیید ناموفق</h1>
          <p className="text-sm text-stone leading-relaxed">{errorMsg}</p>
          <a
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal transition-colors"
          >
            بازگشت به ورود
          </a>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center px-4">
      <AmbientField />
      <Suspense fallback={
        <div className="relative z-10 flex flex-col items-center gap-4">
          <span className="inline-block w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone">در حال بارگذاری…</p>
        </div>
      }>
        <VerifyEmailInner />
      </Suspense>
    </main>
  );
}
