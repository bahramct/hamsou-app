"use client";

// ─────────────────────────────────────────────────────────────────────────────
// WalletReceiptModal — نمایش + دانلودِ رسید یک تراکنش (DECISION-062)
// دادهٔ رسید را از API می‌گیرد، QR code را تولید می‌کند، canvas را نشان می‌دهد،
// و با html-to-image دانلود می‌کند.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { toast } from "@/lib/notifications/toast";
import { Spinner } from "@/components/ui/Spinner";
import { WalletReceiptCanvas, type ReceiptData } from "@/components/features/wallet/WalletReceiptCanvas";

export function WalletReceiptModal({ txId, onClose }: { txId: string; onClose: () => void }) {
  const [data, setData] = useState<ReceiptData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/wallet/receipt/${txId}`, { cache: "no-store" });
        const d = await res.json();
        if (!active) return;
        if (d.ok) {
          const receipt = d.receipt as ReceiptData;
          setData(receipt);
          // تولید QR code از refCode
          const qr = await QRCode.toDataURL(receipt.refCode, {
            width: 144,
            margin: 1,
            color: { dark: "#1A1A1F", light: "#FFFFFF" },
          });
          if (active) setQrDataUrl(qr);
        } else {
          toast.error(d.error ?? "رسید در دسترس نیست.");
        }
      } catch {
        if (active) toast.error("اتصال برقرار نشد.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [txId]);

  async function download() {
    const node = cardRef.current;
    if (!node) return;
    setDownloading(true);
    try {
      // صبر برای رندر کامل
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `hamsoo-receipt-${data?.refCode ?? txId}.png`;
      a.click();
    } catch {
      toast.error("ساخت تصویر ناموفق بود.");
    } finally {
      setDownloading(false);
    }
  }

  const SCALE = 0.58;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-2xl w-full shadow-2xl"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/6">
          <h3 className="text-sm font-semibold text-ink">رسید پرداخت</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone hover:bg-black/5" aria-label="بستن">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="py-16 flex justify-center"><Spinner /></div>
          ) : data ? (
            <>
              {/* پیش‌نمایش مقیاس‌شده — zoom روی layout هم اثر می‌کند (بدون scroll اضافه) */}
              <div
                className="rounded-xl overflow-hidden border border-black/8 mb-4 shadow-sm"
                style={{ zoom: SCALE }}
              >
                <WalletReceiptCanvas data={data} qrDataUrl={qrDataUrl} innerRef={cardRef} />
              </div>

              <button
                onClick={download}
                disabled={downloading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-ink text-paper text-sm hover:bg-charcoal transition-colors disabled:opacity-40"
              >
                {downloading && <Spinner size={13} />}
                دانلود رسید
              </button>
            </>
          ) : (
            <p className="text-sm text-fog py-8 text-center">رسید در دسترس نیست.</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
