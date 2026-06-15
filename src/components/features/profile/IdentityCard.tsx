"use client";

// ─────────────────────────────────────────────────────────────────────────────
// IdentityCard — کارتِ یکپارچهٔ «هویت و ورود» در پروفایل (DECISION-059)
//
// چهار ردیف: موبایل · ایمیل · نام‌کاربری · رمز عبور — هر کدام با وضعیت و ویرایشِ
// inline. کاربرِ موبایلی ایمیل اضافه می‌کند و بالعکس؛ نام‌کاربری به‌صورت @username
// نمایش داده می‌شود (پایهٔ تگ/منشن در شبکهٔ اجتماعیِ آینده). فقط یک ردیف هم‌زمان باز.
//
// قواعد: toast برای نتیجه (DECISION-046)، متنِ دکمه ثابت + Spinner (DECISION-053).
// حذفِ حساب: مودالِ تأیید درون همین کارت (نه صفحهٔ جدا).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { DevOnly } from "@/components/dev/DevOnly";
import { DevOtpPanel } from "@/components/dev/DevOtpPanel";
import { toFaDigits } from "@/lib/utils/digits";

interface Props {
  phone: string | null;
  email: string | null;
  emailVerified: boolean;
  username: string | null;
  hasPassword: boolean;
}

type RowKey = "phone" | "email" | "username" | "password";

const inp =
  "w-full rounded-xl px-3 py-2.5 text-sm bg-white/70 border border-bone text-ink focus:outline-none focus:border-sage transition-colors disabled:opacity-50";
const codeInp = `${inp} text-center tracking-[0.4em]`;
const btn =
  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-ink text-paper text-xs font-medium hover:bg-charcoal transition-colors disabled:opacity-40";

export function IdentityCard({ phone, email, emailVerified, username, hasPassword }: Props) {
  const [open, setOpen] = useState<RowKey | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const toggle = (k: RowKey) => setOpen((cur) => (cur === k ? null : k));

  return (
    <section className="pf-tile pf-t-identity glass">
      <div className="pf-tile-head">
        <div className="pf-tile-ic ic-id"><PersonIcon /></div>
        <div>
          <h3>هویت و ورود</h3>
          <div className="sub">راه‌های ورود و امنیت حساب</div>
        </div>
      </div>

      {/* موبایل — پس از تأیید قفل می‌شود */}
      <IdRow
        label="شماره موبایل"
        value={phone ? <span dir="ltr">{toFaDigits(phone)}</span> : null}
        badge={phone ? "تأیید شده" : null}
        action={phone ? null : "افزودن"}
        open={open === "phone"}
        onAction={() => toggle("phone")}
      >
        <PhoneAdd onDone={() => setOpen(null)} />
      </IdRow>

      {/* ایمیل — پس از تأیید قفل می‌شود */}
      <IdRow
        label="ایمیل"
        value={email && emailVerified ? <span dir="ltr" className="num-latin">{email}</span> : null}
        badge={email && emailVerified ? "تأیید شده" : null}
        action={email && emailVerified ? null : "افزودن"}
        open={open === "email"}
        onAction={() => toggle("email")}
      >
        <EmailAdd onDone={() => setOpen(null)} />
      </IdRow>

      {/* نام‌کاربری */}
      <IdRow
        label="نام کاربری"
        value={username ? <span dir="ltr" className="num-latin">@{username}</span> : null}
        action={username ? "ویرایش" : "انتخاب"}
        open={open === "username"}
        onAction={() => toggle("username")}
      >
        <UsernameEdit initial={username} onDone={() => setOpen(null)} />
      </IdRow>

      {/* رمز عبور */}
      <IdRow
        label="رمز عبور"
        value={hasPassword ? <span>••••••••</span> : null}
        action={hasPassword ? "تغییر" : "تنظیم"}
        open={open === "password"}
        onAction={() => toggle("password")}
      >
        <PasswordEdit
          hasPassword={hasPassword}
          email={email}
          emailVerified={emailVerified}
          onDone={() => setOpen(null)}
        />
      </IdRow>

      {/* حذف حساب */}
      <div className="pf-cta-foot">
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="text-xs text-fog hover:text-ember transition-colors"
        >
          حذف حساب کاربری
        </button>
      </div>

      {showDelete && (
        <DeleteModal
          phone={phone}
          email={email}
          onClose={() => setShowDelete(false)}
        />
      )}
    </section>
  );
}

// ─── ردیفِ پایه — مطابق mockup (.pf-field) با ویرایشگرِ inline زیر ردیف ─────────
function IdRow({
  label, value, badge, action, open, onAction, children,
}: {
  label: string;
  value: React.ReactNode | null;
  badge?: string | null;
  action: string | null;
  open: boolean;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="pf-field">
        <span className="k">{label}</span>
        <div className="vrow">
          <span className="val">
            {value ?? <span style={{ color: "var(--color-fog)" }}>تنظیم نشده</span>}
          </span>
          {badge && <span className="pf-verified">{badge}</span>}
          {action && (
            <button type="button" className="pf-editlink" onClick={onAction}>
              {open ? "بستن" : action}
            </button>
          )}
        </div>
      </div>
      {open && action && (
        <div className="animate-fade-in" style={{ padding: "2px 0 12px" }}>
          {children}
        </div>
      )}
    </>
  );
}

// ─── input رمز عبور با toggle نمایش/پنهان ────────────────────────────────────
function PwInput({
  value, onChange, placeholder, disabled, autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        dir="ltr"
        placeholder={placeholder}
        className={`${inp} pr-16`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-stone hover:text-ink transition-colors"
      >
        {show ? "پنهان" : "نمایش"}
      </button>
    </div>
  );
}

// ─── افزودن موبایل (OTP) ─────────────────────────────────────────────────────
function PhoneAdd({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "code">("form");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  async function request() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/phone/request-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const d = (await res.json()) as { error?: string; devCode?: string };
      if (!res.ok) { toast.error(d.error ?? "خطا."); return; }
      if (typeof d.devCode === "string") setDevCode(d.devCode);
      setStep("code");
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/phone/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { toast.error(d.error ?? "کد نادرست."); return; }
      toast.success("موبایل تأیید شد");
      onDone(); router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <input
        inputMode="numeric" dir="ltr" placeholder="۰۹۱۲۳۴۵۶۷۸۹"
        value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy || step === "code"}
        className={`${inp} text-center`}
      />
      {step === "form" ? (
        <button onClick={request} disabled={busy || !phone.trim()} className={btn}>
          {busy && <Spinner />}ارسال کد
        </button>
      ) : (
        <>
          <input
            inputMode="numeric" dir="ltr" placeholder="کد ۶ رقمی"
            value={code}
            onChange={(e) => setCode(onlyDigits(e.target.value).slice(0, 6))}
            disabled={busy} className={codeInp}
          />
          <button onClick={verify} disabled={busy || code.length < 6} className={btn}>
            {busy && <Spinner />}تأیید موبایل
          </button>
          <DevOnly><DevOtpPanel code={devCode} onFill={(c) => setCode(onlyDigits(c).slice(0, 6))} /></DevOnly>
        </>
      )}
    </div>
  );
}

// ─── افزودن ایمیل (کد) ───────────────────────────────────────────────────────
function EmailAdd({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "code">("form");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  async function request() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/email/request-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = (await res.json()) as { error?: string; devCode?: string };
      if (!res.ok) { toast.error(d.error ?? "خطا."); return; }
      if (typeof d.devCode === "string") setDevCode(d.devCode);
      setStep("code");
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/email/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { toast.error(d.error ?? "کد نادرست."); return; }
      toast.success("ایمیل تأیید شد");
      onDone(); router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <input
        type="email" dir="ltr" autoCapitalize="none" placeholder="you@example.com"
        value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy || step === "code"}
        className={`${inp} num-latin`}
      />
      {step === "form" ? (
        <button onClick={request} disabled={busy || !email.trim()} className={btn}>
          {busy && <Spinner />}ارسال کد
        </button>
      ) : (
        <>
          <input
            inputMode="numeric" dir="ltr" placeholder="کد ۶ رقمی"
            value={code}
            onChange={(e) => setCode(onlyDigits(e.target.value).slice(0, 6))}
            disabled={busy} className={codeInp}
          />
          <button onClick={verify} disabled={busy || code.length < 6} className={btn}>
            {busy && <Spinner />}تأیید ایمیل
          </button>
          <DevOnly><DevOtpPanel code={devCode} onFill={(c) => setCode(onlyDigits(c).slice(0, 6))} /></DevOnly>
        </>
      )}
    </div>
  );
}

// ─── نام‌کاربری ──────────────────────────────────────────────────────────────
function UsernameEdit({ initial, onDone }: { initial: string | null; onDone: () => void }) {
  const router = useRouter();
  const [username, setUsername] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/credentials", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { toast.error(d.error ?? "خطا."); return; }
      toast.success("نام کاربری ذخیره شد");
      onDone(); router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fog text-sm">@</span>
        <input
          dir="ltr" autoCapitalize="none" placeholder="username"
          value={username} onChange={(e) => setUsername(e.target.value)} disabled={busy}
          className={`${inp} num-latin pr-7`}
        />
      </div>
      <p className="text-[11px] text-fog">۳ تا ۲۴ کاراکتر؛ حروف کوچک انگلیسی، رقم و زیرخط.</p>
      <button onClick={save} disabled={busy || !username.trim()} className={btn}>
        {busy && <Spinner />}ذخیره
      </button>
    </div>
  );
}

// ─── رمز عبور (مستقیم + از طریق ایمیل) ──────────────────────────────────────
function PasswordEdit({
  hasPassword,
  email,
  emailVerified,
  onDone,
}: {
  hasPassword: boolean;
  email: string | null;
  emailVerified: boolean;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"direct" | "email">("direct");

  return mode === "email" && email && emailVerified ? (
    <PasswordEmailReset email={email} onDone={onDone} onBack={() => setMode("direct")} />
  ) : (
    <PasswordDirect
      hasPassword={hasPassword}
      canEmailReset={!!email && emailVerified}
      onDone={onDone}
      onSwitchToEmail={() => setMode("email")}
    />
  );
}

function PasswordDirect({
  hasPassword,
  canEmailReset,
  onDone,
  onSwitchToEmail,
}: {
  hasPassword: boolean;
  canEmailReset: boolean;
  onDone: () => void;
  onSwitchToEmail: () => void;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (next !== confirm) { toast.error("رمز جدید و تکرارش یکسان نیستند."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/account/credentials", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: next, currentPassword: current || undefined }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { toast.error(d.error ?? "خطا."); return; }
      toast.success(hasPassword ? "رمز تغییر کرد" : "رمز تنظیم شد");
      onDone(); router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-2">
      {hasPassword && (
        <PwInput
          value={current}
          onChange={setCurrent}
          placeholder="رمز فعلی"
          disabled={busy}
          autoComplete="current-password"
        />
      )}
      <PwInput
        value={next}
        onChange={setNext}
        placeholder="رمز جدید (حداقل ۸ کاراکتر)"
        disabled={busy}
        autoComplete="new-password"
      />
      <PwInput
        value={confirm}
        onChange={setConfirm}
        placeholder="تکرار رمز جدید"
        disabled={busy}
        autoComplete="new-password"
      />
      <button
        onClick={save}
        disabled={busy || next.length < 8 || !confirm || (hasPassword && !current)}
        className={btn}
      >
        {busy && <Spinner />}{hasPassword ? "تغییر رمز" : "تنظیم رمز"}
      </button>
      {canEmailReset && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onSwitchToEmail}
            className="text-[11px] text-stone hover:text-sage-deep transition-colors"
          >
            تغییر از طریق ایمیل ←
          </button>
        </div>
      )}
    </div>
  );
}

function PasswordEmailReset({
  email,
  onDone,
  onBack,
}: {
  email: string;
  onDone: () => void;
  onBack: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"send" | "verify">("send");
  const [code, setCode] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1…$2");

  async function send() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/reset-password/request", { method: "POST" });
      const d = (await res.json()) as { error?: string; devCode?: string };
      if (!res.ok) { toast.error(d.error ?? "خطا."); return; }
      if (typeof d.devCode === "string") setDevCode(d.devCode);
      setStep("verify");
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  async function verify() {
    if (next !== confirm) { toast.error("رمز جدید و تکرارش یکسان نیستند."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/account/reset-password/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, newPassword: next }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) { toast.error(d.error ?? "خطا."); return; }
      toast.success("رمز با موفقیت تغییر کرد");
      onDone(); router.refresh();
    } catch { toast.error("اتصال برقرار نشد."); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      {step === "send" ? (
        <>
          <p className="text-xs text-fog leading-relaxed">
            یک کد تأیید به <span dir="ltr" className="num-latin text-stone">{maskedEmail}</span> ارسال می‌شود.
          </p>
          <button onClick={send} disabled={busy} className={btn}>
            {busy && <Spinner />}ارسال کد
          </button>
        </>
      ) : (
        <>
          <p className="text-xs text-fog">کد ارسال‌شده به <span dir="ltr" className="num-latin text-stone">{maskedEmail}</span></p>
          <input
            inputMode="numeric" dir="ltr" placeholder="کد ۶ رقمی"
            value={code}
            onChange={(e) => setCode(onlyDigits(e.target.value).slice(0, 6))}
            disabled={busy} className={codeInp}
          />
          <PwInput value={next} onChange={setNext} placeholder="رمز جدید" disabled={busy} autoComplete="new-password" />
          <PwInput value={confirm} onChange={setConfirm} placeholder="تکرار رمز جدید" disabled={busy} autoComplete="new-password" />
          <button
            onClick={verify}
            disabled={busy || code.length < 6 || next.length < 8 || !confirm}
            className={btn}
          >
            {busy && <Spinner />}تأیید و تغییر رمز
          </button>
          <DevOnly><DevOtpPanel code={devCode} onFill={(c) => setCode(onlyDigits(c).slice(0, 6))} /></DevOnly>
        </>
      )}
      <button
        type="button"
        onClick={onBack}
        className="text-[11px] text-stone hover:text-ink transition-colors"
      >
        → بازگشت
      </button>
    </div>
  );
}

// ─── کمکی ────────────────────────────────────────────────────────────────────
function onlyDigits(s: string): string {
  return s.replace(/[^۰-۹0-9]/g, "").replace(/[۰-۹]/g, (d) => String(d.codePointAt(0)! - 0x06f0));
}

// ─── آیکن‌ها ──────────────────────────────────────────────────────────────────
const ico = { width: 17, height: 17, fill: "none", stroke: "currentColor", strokeWidth: 1.6, viewBox: "0 0 24 24", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function PersonIcon() { return <svg {...ico}><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>; }

// ─── مودال حذف حساب ──────────────────────────────────────────────────────────
function DeleteModal({ phone, email, onClose }: { phone: string | null; email: string | null; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmInput, setConfirmInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const useEmail = !phone && !!email;
  const targetValue = phone ?? email ?? "";

  async function handleDelete() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmInput }),
      });
      const data = (await res.json()) as { message?: string; ok?: boolean };
      if (!res.ok || !data.ok) { setError(data.message ?? "خطایی رخ داد"); return; }
      router.push("/");
    } catch {
      setError("اتصال به سرور برقرار نشد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div className="glass-strong rounded-3xl w-full max-w-sm animate-fade-up">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-ember">حذف حساب کاربری</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="بستن"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-fog hover:text-ink hover:bg-black/6 transition-colors disabled:opacity-50"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {step === 1 ? (
            <>
              <p className="text-sm text-stone leading-loose">
                با حذف حساب، تمام داده‌هایت — تعهدها، بازخوردها، گزارش‌ها — برای همیشه پاک می‌شوند.
              </p>
              <p className="text-xs text-fog">این عملیات قابل بازگشت نیست.</p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-bone text-sm text-stone hover:text-ink transition-colors">
                  انصراف
                </button>
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-xl border border-ember/40 bg-ember/5 text-sm text-ember hover:bg-ember/10 transition-colors">
                  ادامه
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-sm text-stone">
                  برای تأیید، {useEmail ? "ایمیل" : "شماره موبایل"} خود را وارد کن:
                </p>
                <p className={`text-xs text-fog ${useEmail ? "num-latin" : ""}`} dir="ltr">
                  {useEmail ? targetValue : toFaDigits(targetValue)}
                </p>
              </div>
              <input
                type={useEmail ? "email" : "tel"}
                value={confirmInput}
                onChange={(e) => { setConfirmInput(e.target.value); setError(null); }}
                disabled={busy}
                placeholder={useEmail ? "ایمیل" : "شماره موبایل"}
                dir="ltr"
                className={inp}
              />
              {error && <p className="text-xs text-ember">{error}</p>}
              <div className="flex gap-3">
                <button type="button"
                  onClick={() => { setStep(1); setConfirmInput(""); setError(null); }}
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-xl border border-bone text-sm text-stone hover:text-ink transition-colors disabled:opacity-50">
                  انصراف
                </button>
                <button type="button" onClick={handleDelete}
                  disabled={busy || !confirmInput.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-ember/10 border border-ember/40 text-sm text-ember hover:bg-ember/20 disabled:opacity-40 transition-colors">
                  {busy && <Spinner />}
                  حذف نهایی
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
