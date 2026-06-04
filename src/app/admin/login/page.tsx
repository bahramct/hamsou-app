"use client";

// ─────────────────────────────────────────────────────────────────────────────
// /admin/login — ورود به پنل مدیریت همسو با نام کاربری و رمز عبور (DECISION-038)
// پس از موفقیت: اگر mustChangePassword → /admin/change-password، وگرنه /admin
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطایی رخ داد.");
        return;
      }
      router.push(data.mustChangePassword ? "/admin/change-password" : "/admin");
      router.refresh();
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 bg-paper">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-ink text-paper flex items-center justify-center">
            <ShieldIcon />
          </div>
          <span className="text-[11px] tracking-[0.2em] text-fog uppercase">پنل مدیریت</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-ink tracking-tight mb-2">ورود مدیران همسو</h1>
          <p className="text-sm text-stone leading-relaxed">نام کاربری و رمز عبور خود را وارد کن</p>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-xs font-medium text-stone">نام کاربری</label>
              <input
                ref={userRef}
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                disabled={loading}
                dir="ltr"
                className="w-full rounded-xl px-4 py-3 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all duration-350 disabled:opacity-50 num-latin"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-stone">رمز عبور</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  disabled={loading}
                  dir="ltr"
                  className="w-full rounded-xl pl-4 pr-16 py-3 text-sm bg-white/60 border border-bone text-ink placeholder:text-fog focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all duration-350 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-stone hover:text-ink"
                  tabIndex={-1}
                >
                  {showPw ? "پنهان" : "نمایش"}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-ember text-center animate-fade-in">{error}</p>}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full py-3.5 rounded-xl bg-ink text-paper text-sm font-medium hover:bg-charcoal active:scale-[0.98] transition-all duration-350 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "در حال بررسی…" : "ورود به پنل"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-fog mt-6 leading-6">
          این بخش فقط برای کارکنان مجاز همسو است.
        </p>
      </div>
    </main>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
