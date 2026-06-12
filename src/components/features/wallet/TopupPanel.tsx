"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TopupPanel — مودالِ درخواست شارژ کیف‌پول (DECISION-062)
// مبلغ + انتخاب کارت → ساخت درخواست → نمایش کارت مرجع + شناسهٔ یکتا + راهنما.
// با ۲ کارت، کاربر مشخص می‌کند از کدام کارت واریز می‌کند (برای تطبیق ادمین).
// طبق DECISION-053: متن دکمه ثابت + Spinner؛ نتیجه با toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { onlyDigits } from "@/lib/utils/digits";

interface CreatedTopup {
  refCode: string;
  amount: number;
  selectedCard: string;
  card: { cardNumber: string; holderName: string; bankName: string };
}

function groupCard(num: string): string {
  return (num.match(/.{1,4}/g) ?? [num]).join(" - ");
}

export function TopupPanel({
  hasCard,
  cardNumber,
  cardNumber2,
  suggestedAmount,
  onClose,
  onDone,
}: {
  hasCard: boolean;
  cardNumber?: string | null;
  cardNumber2?: string | null;
  suggestedAmount?: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(suggestedAmount ? String(suggestedAmount) : "");
  const [selectedSlot, setSelectedSlot] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [busyGateway, setBusyGateway] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [created, setCreated] = useState<CreatedTopup | null>(null);

  const hasTwoCards = Boolean(cardNumber && cardNumber2);

  function validAmount(): number | null {
    const amt = parseInt(onlyDigits(amount), 10);
    if (!amt || amt < 10000) {
      toast.error("حداقل مبلغ شارژ ۱۰٬۰۰۰ تومان است.");
      return null;
    }
    return amt;
  }

  // پرداختِ آنلاین — مسیرِ اصلی (نیازی به کارتِ ثبت‌شده ندارد)
  async function payOnline() {
    const amt = validAmount();
    if (amt === null) return;
    setBusyGateway(true);
    try {
      const res = await fetch("/api/wallet/topup/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      const d = await res.json();
      if (!res.ok || !d.startPayUrl) {
        toast.error(d.error ?? "اتصال به درگاه پرداخت ناموفق بود.");
        return;
      }
      window.location.href = d.startPayUrl; // هدایت به درگاه
    } catch {
      toast.error("اتصال برقرار نشد.");
    } finally {
      setBusyGateway(false);
    }
  }

  async function submit() {
    const amt = parseInt(onlyDigits(amount), 10);
    if (!amt || amt < 10000) {
      toast.error("حداقل مبلغ شارژ ۱۰٬۰۰۰ تومان است.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, cardSlot: hasTwoCards ? selectedSlot : 1 }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error ?? "ثبت درخواست ناموفق بود.");
        return;
      }
      setCreated(d as CreatedTopup);
      onDone();
    } catch {
      toast.error("اتصال برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text).then(
      () => toast.success(`${label} کپی شد`),
      () => toast.error("کپی نشد")
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-paper rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink">شارژ کیف‌پول</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone hover:bg-black/5" aria-label="بستن">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        {!created ? (
          <>
            <label className="text-[12px] font-medium text-stone">مبلغ شارژ (تومان)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              dir="ltr"
              autoComplete="off"
              placeholder="100000"
              className="w-full mt-1 rounded-lg px-3 py-2.5 text-sm bg-white/80 border border-bone text-ink focus:outline-none focus:border-sage num-latin text-center"
            />
            {amount && Number(onlyDigits(amount)) > 0 && (
              <p className="text-[11px] text-fog mt-1.5 text-center fa-num">
                {Number(onlyDigits(amount)).toLocaleString("fa-IR")} تومان
              </p>
            )}

            {/* مسیرِ اصلی: پرداختِ آنلاین — بدونِ نیاز به کارتِ ثبت‌شده */}
            <button
              onClick={payOnline}
              disabled={busyGateway}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-paper text-sm hover:bg-charcoal transition-colors disabled:opacity-40"
            >
              {busyGateway && <Spinner size={13} />}
              پرداخت آنلاین
            </button>
            <p className="text-[11px] text-fog mt-1.5 text-center leading-relaxed">
              به درگاهِ بانکی هدایت می‌شوی؛ پس از پرداخت، کیف‌پولت بلافاصله شارژ می‌شود.
            </p>

            {/* گزینهٔ دوم: واریزِ کارت‌به‌کارت (نیازمندِ کارتِ ثبت‌شده + تأییدِ پشتیبانی) */}
            {!showCard ? (
              <button
                onClick={() => setShowCard(true)}
                className="w-full mt-3 text-[12px] text-stone hover:text-ink transition-colors"
              >
                یا واریز کارت‌به‌کارت
              </button>
            ) : (
              <div className="mt-4 pt-4 border-t border-black/8">
                <div className="text-[12px] font-medium text-stone mb-2">واریز کارت‌به‌کارت</div>
                {!hasCard && (
                  <div className="rounded-xl bg-ember/8 border border-ember/20 px-3 py-2.5 text-[12px] text-ember mb-3 leading-relaxed">
                    اول باید شماره کارتی که با آن واریز می‌کنی را در پروفایل ثبت کنی.
                  </div>
                )}

                {/* انتخاب کارت — فقط اگر ۲ کارت داشت */}
                {hasTwoCards && (
                  <div className="mb-3">
                    <div className="text-[12px] font-medium text-stone mb-1.5">واریز از کدام کارت؟</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2].map((s) => {
                        const cn = s === 1 ? cardNumber : cardNumber2;
                        const active = selectedSlot === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setSelectedSlot(s as 1 | 2)}
                            className={`rounded-xl border px-3 py-2.5 text-right transition-colors ${
                              active ? "border-sage bg-sage/8" : "border-bone bg-white/40 hover:border-stone/30"
                            }`}
                          >
                            <div className="text-[10px] text-fog mb-0.5">کارت {s === 1 ? "اول" : "دوم"}</div>
                            <div dir="ltr" className="text-xs font-semibold text-ink num-latin">
                              {cn ? groupCard(cn) : "—"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={busy || !hasCard}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-bone text-ink text-sm hover:border-stone/40 transition-colors disabled:opacity-40"
                >
                  {busy && <Spinner size={13} />}
                  ادامه و دریافت شناسه
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-sage/8 border border-sage/25 px-4 py-3 text-[12px] text-sage-deep leading-relaxed">
              مبلغ <b className="fa-num">{created.amount.toLocaleString("fa-IR")}</b> تومان را
              {" "}<b>از کارت {groupCard(created.selectedCard)}</b>{" "}
              به کارت زیر واریز کن. سپس پشتیبانی با شناسهٔ زیر آن را بررسی و کیف‌پولت را شارژ می‌کند.
            </div>

            {/* کارت مرجع */}
            <div className="rounded-xl border border-black/10 bg-white/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-fog">شماره کارت مقصد</span>
                <button onClick={() => copy(created.card.cardNumber, "شماره کارت")} className="text-[11px] text-ember hover:underline">کپی</button>
              </div>
              <div dir="ltr" className="text-lg font-semibold text-ink num-latin tracking-wide text-center">{groupCard(created.card.cardNumber)}</div>
              <div className="flex items-center justify-between text-[12px] text-stone pt-1 border-t border-black/5">
                <span>{created.card.bankName}</span>
                <span>{created.card.holderName}</span>
              </div>
            </div>

            {/* شناسهٔ یکتا */}
            <div className="rounded-xl border border-black/10 bg-white/60 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-fog">شناسهٔ پیگیری (این را نگه‌دار)</span>
                <button onClick={() => copy(created.refCode, "شناسه")} className="text-[11px] text-ember hover:underline">کپی</button>
              </div>
              <div dir="ltr" className="text-base font-bold text-ink num-latin text-center">{created.refCode}</div>
            </div>

            <p className="text-[11px] text-fog leading-relaxed text-center">
              وضعیت این شارژ «در انتظار تأیید» است. پس از تأیید پشتیبانی، اعلان دریافت می‌کنی و رسید قابل دانلود می‌شود.
            </p>
            <button onClick={onClose} className="w-full px-4 py-2.5 rounded-xl bg-ink text-paper text-sm hover:bg-charcoal transition-colors">
              متوجه شدم
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
